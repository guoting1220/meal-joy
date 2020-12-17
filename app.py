import os
from flask import Flask, render_template, request, flash, redirect, session, g, jsonify, url_for
from flask_debugtoolbar import DebugToolbarExtension
from sqlalchemy.exc import IntegrityError
from forms import UserAddForm, LoginForm, RecipeForm, MealPlanForm
from models import db, connect_db, User, DiyRecipe, Likes, MealPlan
import requests

CURR_USER_KEY = "curr_user"

app = Flask(__name__)

# Get DB_URI from environ variable (useful for production/testing) or,
# if not set there, use development local db.
app.config['SQLALCHEMY_DATABASE_URI'] = (
    os.environ.get('DATABASE_URL', 'postgres:///meal_plan'))

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', "it's a secret")
toolbar = DebugToolbarExtension(app)

connect_db(app)


##############################################################################
# User signup/login/logout


# The before_request decorator allows us to create a function that will run before each request.
@app.before_request
def add_user_to_g():
    """If we're logged in, add curr user to Flask global."""

    if CURR_USER_KEY in session:
        g.user = User.query.get(session[CURR_USER_KEY])

    else:
        g.user = None


def do_login(user):
    """Log in user."""

    session[CURR_USER_KEY] = user.id


def do_logout():
    """Logout user."""

    if CURR_USER_KEY in session:
        del session[CURR_USER_KEY]



@app.route('/')
def homepage():
    """Show homepage"""

    return render_template('home.html')


# routes for user =================================================================
@app.route('/signup', methods=["GET", "POST"])
def signup():
    """Handle user signup.
    Create new user and add to DB. Redirect to home page.
    If form not valid, present form.
    If the there already is a user with that username: flash message
    and re-present form.
    """

    form = UserAddForm()

    if form.validate_on_submit():
        try:
            user = User.signup(
                username=form.username.data,
                password=form.password.data,
                email=form.email.data                
            )
            db.session.commit()

        except IntegrityError:
            flash("Username already taken", 'danger')
            return render_template('user/signup.html', form=form)

        do_login(user)

        return redirect(url_for('homepage'))

    else:
        return render_template('user/signup.html', form=form)


@app.route('/login', methods=["GET", "POST"])
def login():
    """Handle user login."""

    form = LoginForm()

    if form.validate_on_submit():
        user = User.authenticate(form.username.data,
                                 form.password.data)

        if user:
            do_login(user)
            # flash(f"Hello, {user.username}!", "success")
            return redirect(url_for('homepage'))

        flash("Invalid credentials.", 'danger')

    return render_template('user/login.html', form=form)


@app.route('/logout')
def logout():
    """Handle logout of user."""

    do_logout()

    return redirect(url_for('homepage'))


@app.route('/user')
def user_profile():
    """Show user's profile."""

    return render_template('user/profile.html')
  

@app.route('/user/delete', methods=["POST"])
def delete_user():
    """Delete user."""

    if not g.user:
        flash("Access unauthorized.", "danger")
        return redirect(url_for('homepage'))

    do_logout()

    db.session.delete(g.user)
    db.session.commit()
    flash("User Deleted!", "success")
    return redirect("/")


@app.route('/user/likes')
def show_likes():
    """ Show all the user's favorite meal recipes from API"""

    if not g.user:
        flash("Please sign up or login first!", "danger")
        redirect(url_for('homepage'))

    # user = User.query.get_or_404(g.user.id)
    # likes = user.likes

    likes = Likes.query.filter(
        Likes.user_id == g.user.id       
    ).all()

    likedMealIds = [like.meal_id for like in likes]

    return jsonify(likedMealIds=likedMealIds)


# routes for DIY recipes =============================================
@app.route('/diy_recipes')
def list_diy_recipes():
    """Show all the user's DIY recipes"""

    if not g.user:
        flash("Please sign up or login first!", "danger")
        return redirect(url_for('homepage'))

    recipes = DiyRecipe.query.all()

    return render_template('diy_recipes/show_all.html', recipes=recipes)


@app.route('/diy_recipes/<int:diy_recipe_id>')
def show_recipe_detail(diy_recipe_id):
    """Show detail of a DIY recipe"""

    recipe = DiyRecipe.query.get_or_404(diy_recipe_id)

    return render_template('diy_recipes/detail.html', recipe=recipe)


@app.route('/diy_recipes/new', methods=["GET", "POST"])
def add_diy_recipe():
    """Add new DIY recipe"""

    if not g.user:
        flash("Please sign up or login first!", "danger")
        return redirect(url_for('homepage'))

    form = RecipeForm()

    if form.validate_on_submit():
        recipe = DiyRecipe(
            name=form.name.data,
            ingredients=form.ingredients.data,
            description=form.description.data,
            image_url=form.image_url.data or None,
        )

        # db.session.add(recipe)
        g.user.own_recipes.append(recipe)
        db.session.commit()

        return redirect(url_for('list_diy_recipes'))

    return render_template('diy_recipes/new.html', form=form)


@app.route('/diy_recipes/<int:diy_recipe_id>/edit', methods=["GET", "POST"])
def edit_diy_recipe(diy_recipe_id):
    """ edit DIY recipe """

    if not g.user:
        flash("Access unauthorized.", "danger")
        return redirect(url_for('homepage'))

    recipe = DiyRecipe.query.get_or_404(diy_recipe_id)
    form = RecipeForm(obj=recipe)

    if form.validate_on_submit():
        recipe.name = form.name.data,
        recipe.ingredients = form.ingredients.data,
        recipe.description = form.description.data,
        recipe.image_url = form.image_url.data or None,

        db.session.commit()

        flash(f"{recipe.name} updated.", "success")
        return redirect(url_for('show_recipe_detail', diy_recipe_id=recipe.id))
    else:
        return render_template("diy_recipes/edit.html", form=form, recipe=recipe)


@app.route('/diy_recipes/<int:diy_recipe_id>/delete', methods=["POST"])
def delete_diy_recipe(diy_recipe_id):
    """Delete a DIY recipe."""

    if not g.user:
        flash("Access unauthorized.", "danger")
        return redirect(url_for('homepage'))

    recipe = DiyRecipe.query.get_or_404(diy_recipe_id)

    if recipe.user_id != g.user.id:
        flash("Access unauthorized.", "danger")
        return redirect(url_for('list_diy_recipes'))

    db.session.delete(recipe)
    db.session.commit()

    flash("Recipe Deleted.", "success")
    return redirect(url_for('list_diy_recipes'))


#  routes for food and meal recipes ======================================

@app.route('/meals/categories')
def show_meal_categories():
    """Show all the meal categories"""       
    
    return render_template("meals/categories.html")

 
@app.route('/meals/recipes')
def show_meal_recipes():
    """Show all the meal recipes"""       
    
    return render_template("meals/recipes.html")


@app.route('/meals/recipes/<int:rec_id>/check-if-like')
def check_if_like(rec_id):
    """Check if the recipe is liked by current user"""

    # if not g.user:        
    #     return jsonify({"result": "invalid"})

    like = Likes.query.filter(
        Likes.user_id == g.user.id,
        Likes.meal_id == rec_id
    ).first()      
    
    if like:        
        return jsonify({"result": "like"})
    else:
        return jsonify({"result": "unlike"})



@app.route('/meals/recipes/<int:rec_id>/like', methods=['POST'])
def toggle_like(rec_id):
    """Toggle a like for the current user"""

    # if not g.user:
    #     flash("Please sign up or login first!", "danger")
    #     return jsonify({"result":"invalid"})

    like = Likes.query.filter(
        Likes.user_id == g.user.id,
        Likes.meal_id == rec_id
    ).first()
   
    if like:
        db.session.delete(like)
        db.session.commit()
        return jsonify({"result": "unlike"})
    else:
        like = Likes(user_id=g.user.id, meal_id=rec_id)
        db.session.add(like)
        db.session.commit()
        return jsonify({"result": "like"})





##############################################################################
# Turn off all caching in Flask
#   (useful for dev; in production, this kind of stuff is typically
#   handled elsewhere)
#
# https://stackoverflow.com/questions/34066804/disabling-caching-in-flask

@app.after_request
def add_header(req):
    """Add non-caching headers on every request."""

    req.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    req.headers["Pragma"] = "no-cache"
    req.headers["Expires"] = "0"
    req.headers['Cache-Control'] = 'public, max-age=0'
    return req
