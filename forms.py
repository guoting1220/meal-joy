from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, SelectField
from wtforms.validators import DataRequired, Optional, Email, Length


class UserAddForm(FlaskForm):
    """Form for adding users."""

    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[Length(min=6)])
    email = StringField('E-mail', validators=[DataRequired(), Email()])

class LoginForm(FlaskForm):
    """Form for user to Login."""

    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[Length(min=6)])


class RecipeForm(FlaskForm):
    """Form for adding/editing diy recipes."""
    name = StringField('Recipe Name', validators=[DataRequired()])
    ingredients = StringField('Ingredients', validators=[DataRequired()])
    description = TextAreaField('Description', validators=[DataRequired()])
    image_url = StringField('Image URL (Optional)', validators=[Optional()])


class MealPlanForm(FlaskForm):
    """Form for adding/editing meal plan."""
    day = SelectField('Day of the Week',
                      choices=[('sun', 'Sun'),
                               ('mon', 'Mon'),
                               ('tue', 'Tue'),
                               ('wed', 'Wed'),
                               ('thur', 'Thur'),
                               ('fri', 'Fri'),
                               ('sat', 'Sat')
                               ],
                      validators=[DataRequired()]
                      )
    meal_type = SelectField('Meal Time',
                            choices=[('breakfast', 'Breakfast'),
                                     ('lunch', 'Lunch'),
                                     ('dinner', 'Dinner'),
                                     ('dessert', 'Dessert')
                                    ],
                            validators=[DataRequired()]
                            )
    meal_name = StringField('Meal Name', validators=[DataRequired()])

    

