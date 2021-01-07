import os
from flask import Flask, render_template, request, flash, redirect, session, g, jsonify, url_for
from flask_debugtoolbar import DebugToolbarExtension
from sqlalchemy.exc import IntegrityError
from forms import UserAddForm, LoginForm
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
            flash("Username or email already taken", 'danger')
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
    """get all the user's DIY recipes"""

    if not g.user:
        flash("Please sign up or login first!", "danger")
        return redirect(url_for('homepage'))

    diyRecipes = g.user.own_recipes
    diyRecipeList = [rec.serialize() for rec in diyRecipes]
    
    return jsonify(diyRecipes=diyRecipeList)


@app.route('/diy_recipes/<int:diy_recipe_id>')
def show_recipe_detail(diy_recipe_id):
    """get the DIY recipe with perticular id"""

    recipe = DiyRecipe.query.get_or_404(diy_recipe_id)

    return jsonify(diy_recipe=recipe.serialize())


@app.route('/diy_recipes/new', methods=['POST'])
def add_diy_recipe():
    """Add new DIY recipe"""
    
    if not g.user:
        flash("Please sign up or login first!", "danger")
        return redirect(url_for('homepage'))

    name = request.json["name"]
    img_url = request.json["imgURL"]
    ingredients = request.json["ingredients"]
    description = request.json["description"]
    
    diy_recipe = DiyRecipe(name=name, 
                           ingredients=ingredients,
                           description=description, 
                           image_url=img_url,
                           user_id=g.user.id
                           )
    # don't forget "user_id=g.user.id" !!!!

    db.session.add(diy_recipe)
    db.session.commit()

    return jsonify(diy_recipe=diy_recipe.serialize())


@app.route('/diy_recipes/<int:diy_recipe_id>/edit', methods=["GET", "POST"])
def edit_diy_recipe(diy_recipe_id):
    """ edit DIY recipe """

    if not g.user:
        flash("Access unauthorized.", "danger")
        return redirect(url_for('homepage'))

    recipe = DiyRecipe.query.get_or_404(diy_recipe_id)

    recipe.name = request.json["name"]
    recipe.ingredients = request.json["ingredients"]
    recipe.description = request.json["description"]
    recipe.image_url = request.json["imgURL"]

    db.session.commit()

    return jsonify(diy_recipe=recipe.serialize())


@app.route('/diy_recipes/<int:diy_recipe_id>/delete', methods=["POST"])
def delete_diy_recipe(diy_recipe_id):
    """Delete a DIY recipe."""

    if not g.user:
        flash("Access unauthorized.", "danger")
        return redirect(url_for('homepage'))

    recipe = DiyRecipe.query.get_or_404(diy_recipe_id)

    if recipe.user_id != g.user.id:
        flash("Access unauthorized.", "danger")
        return redirect(url_for('homepage'))

    db.session.delete(recipe)
    db.session.commit()

    # flash("Recipe Deleted.", "success")
    return jsonify(result="deleted")


#  routes for API recipes ======================================

@app.route('/meals/<int:rec_id>/check-if-like')
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



@app.route('/meals/<int:rec_id>/like', methods=['POST'])
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


#  routes for Meal Plan ======================================

@app.route('/mealplan')
def get_mealplan_data():
    """ Get the data of My Meal Plan"""

    if not g.user:
        flash("Please sign up or login first!", "danger")
        return redirect(url_for('homepage'))

    meal_plan = g.user.meal_plan
    meal_plan_list = [mp.serialize() for mp in meal_plan]

    return jsonify(meal_plan_list=meal_plan_list)



@app.route('/mealplan', methods=["POST"])
def add_to_mealplan():
    """ Add the recipe to My Meal Plan"""

    if not g.user:
        flash("Please sign up or login first!", "danger")
        return redirect(url_for('homepage'))

    day = request.json["day"]
    meal_type = request.json["mealType"]
    meal_id = request.json["mealId"]

    mp = MealPlan.query.filter(
        MealPlan.day == day,
        MealPlan.meal_type == meal_type,
        MealPlan.meal_id == meal_id
    ).all()

    if not mp: 
        meal_plan = MealPlan(
            day=day,
            meal_type=meal_type,
            meal_id=meal_id,
            user_id=g.user.id
        )
    
        db.session.add(meal_plan)
        db.session.commit()

        return jsonify({"result": "meal added"})

    return jsonify({"result": "duplicated addition"}) 


@app.route('/mealplan/<int:mpid>/delete', methods=["POST"])
def delete_from_mealplan(mpid):
    """ Delete a recipe from My Meal Plan"""

    if not g.user:
        flash("Please sign up or login first!", "danger")
        return redirect(url_for('homepage'))

    meal = MealPlan.query.get_or_404(mpid)
   
    if meal.user_id != g.user.id:
        flash("Access unauthorized.", "danger")
        return redirect(url_for('homepage'))

    db.session.delete(meal)
    db.session.commit()

    return jsonify(result="deleted")
   


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
