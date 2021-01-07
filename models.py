"""SQLAlchemy models for Meal_Plan."""

from datetime import datetime

from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy

bcrypt = Bcrypt()
db = SQLAlchemy()


# Model for User =======================================================

class User(db.Model):
    """User in the system."""

    __tablename__ = 'app_user'

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    ) 

    username = db.Column(
        db.Text,
        nullable=False,
        unique=True,
    ) 

    password = db.Column(
        db.Text,
        nullable=False,
    )

    email = db.Column(
        db.Text,
        nullable=False,
        unique=True,
    )

    own_recipes = db.relationship('DiyRecipe', backref='user')

    meal_plan = db.relationship('MealPlan', backref='user')

    # likes = db.relationship('Likes')

    def __repr__(self):
        return f"<User #{self.id}: {self.username}>"

    @classmethod
    def signup(cls, username, password, email):
        """Sign up user.Hashes password and adds user to database.
        """
        hashed_pwd = bcrypt.generate_password_hash(password).decode('UTF-8')

        user = User(
            username=username,
            password=hashed_pwd,
            email=email            
        )

        db.session.add(user)
        return user

    @classmethod
    def authenticate(cls, username, password):
        """Find user with `username` and `password`.
        It searches for a user whose password hash matches this password
        and, if it finds such a user, returns that user object.

        If can't find matching user (or if password is wrong), returns False.
        """

        user = cls.query.filter_by(username=username).first()

        if user:
            is_auth = bcrypt.check_password_hash(user.password, password)
            if is_auth:
                return user

        return False


# Model for DIY Recipe =================================================

class DiyRecipe(db.Model):
    """model for DIY recipes"""

    __tablename__ = "diy_recipe"

    id = db.Column(
        db.Integer, 
        primary_key=True, 
        autoincrement=True)

    name = db.Column(
        db.Text, 
        nullable=False)

    ingredients = db.Column(
        db.Text, 
        nullable=False)

    description = db.Column(
        db.Text,
        nullable=False,
        default="No Description")

    image_url = db.Column(
        db.Text,
        nullable=False,
        default="/static/images/recipe_default.jpg",
    )

    user_id = db.Column(
        db.Integer, 
        db.ForeignKey("app_user.id"), 
        nullable=False)

    # user = db.relationship('User', backref='diy_cecipes')

    def serialize(self):
        """ return a dict representation of DIY recipe which we can turn into JSON """

        return {
            "id": self.id,
            "name": self.name,
            "ingredients": self.ingredients,
            "description": self.description,
            "image_url": self.image_url
        }


# Model for Likes (user's favorite meal recipe) =======================

class Likes(db.Model):
    """Mapping user likes to users."""

    __tablename__ = 'likes'

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('app_user.id', ondelete='cascade')
    )

    meal_id = db.Column(
        db.Integer
    )



class MealPlan(db.Model):
    """ Model for the weekly meal plan""" 

    __tablename__ = 'mealplan'

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    day = db.Column(
        db.Text,
        nullable=False
    )

    meal_type = db.Column(
        db.Text,
        nullable=False
    )

    meal_id = db.Column(
        db.Text,
        nullable=False
    )

    user_id = db.Column(
        db.Integer, 
        db.ForeignKey('app_user.id', ondelete='cascade')
    )

    def serialize(self):
        """ return a dict representation of Meal Plan which we can turn into JSON """

        return {
            "id": self.id,
            "day": self.day,
            "meal_type": self.meal_type,
            "meal_id": self.meal_id
        }

   


# # Model for the Tag for the meal recipe =====================================

# class Tag(db.Model):
#     """model for the tag """

#     __tablename__ = "tag"

#     id = db.Column(
#         db.Integer, 
#         primary_key=True, 
#         autoincrement=True
#     )

#     name = db.Column(
#         db.Text, 
#         nullable=False, 
#         unique=True
#     )

#     posts = db.relationship('Post', secondary='post_tag', backref='tags')


# class MealTag(db.Model):
#     """ model for the post_tag """

#     __tablename__ = "meal_tag"

# # foreign key ?
#     meal_id = db.Column(
#         db.Integer,        
#         primary_key=True, 
#         nullable=False)

#     tag_id = db.Column(
#         db.Integer, 
#         db.ForeignKey("tag.id"), 
#         primary_key=True,
#         nullable=False)


def connect_db(app):
    """Connect this database to provided Flask app."""

    db.app = app
    db.init_app(app)
