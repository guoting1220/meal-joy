# Meal Joy
Meal Joy is a web application that users can explore tons of healthy recipes, create their DIY recipes and make their weekly meal plan.

### User Flow
Guest users can:
- register or log in to get access to more features

Logged in users can: 
- browser popular recipes
- view the complete detail information for each recipe by clicking on the recipe image
- search recipes by typing key words
- filter the recipes by applying one or multiple filters
- view all the food categories and check out recipes for each category
- save/cancel recipes as favorite
- view all saved favorite recipes
- create DIY recipes by filling the DIY recipe form
- edit or delete their DIY recipes
- view all DIY recipes
- On each recipe detail page (including DIY recipe), users can add current recipe to their weekly meal plan by clicking on the "Add to My Meal Plan" button and selecting the day of the week and the meal type (breakfast, luch, dinner or snack) 
- view the weekly meal plan table
- delete the recipe on the meal plan table

### API Used
https://www.themealdb.com/api.php

### Deployed App Link
https://capstone-1-meal-plan.herokuapp.com

### Tech Stack

##### frontend: 
HTML, CSS, Javascript, jQuery, Bootstrap

##### backend: 
Python, Flask

##### database: 
SQL, PostgreSQL

### Installation and Setup Instructions

##### Create the Python virtual environment:
 `python3 -m venv venv`

 `source venv/bin/activate`
 
 (venv)`pip install -r requirements.txt`

##### Set up the database:
 (venv)`createdb meal_plan`

##### Run the seed file:
 (venv)`python seed.py`

##### Start the server:
 (venv) `flask run`

##### To visit app on localhost:
Open `http://localhost:5000` to view it in the browser.
