$(async function () {

    const MD_BASE_URL = "https://www.themealdb.com/api/json/v1/1";
    const LOCAL_HOST = "http://127.0.0.1:5000";
    const RANDOM_NUM = 12;

    const $recipesContainer = $("#recipesContainer");
    const $cateList = $("#cat-list");
    const $recipesArea = $("#recipesArea");
    const $recipesSearchArea = $("#recipesSearchArea");
    const $recipes = $("#recipes");
    const $recipeDetail = $("#recipeDetail");
    const $noResults = $("#noResults");
    const $loader = $("#loader");
    const $home = $("#home");
    const $welcome = $("#welcome");
    const $filters = $("#filters");
    const $searchInput = $("#rSearch");
    const $recTitle = $("#recTitle");
    const $diyRecipes = $("#diyRecipes");
    const $addOrEditDiy = $("#addOrEditDiy");
    const $diyList = $("#diy-list");
    const $diyRecipeDetail = $("#diyRecipeDetail");
    const $mealPlan = $("#mealPlan");
    const $recName = $("#recName");
    const $imgURL = $("#imgURL");
    const $recIngredients = $("#recIngredients");
    const $recDescription = $("#recDescription");  
    
    let currentMealList = [];
    let searchedResults = [];

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const mealType = ["Breakfast", "Lunch", "Dinner", "Snack"];     



    // *************************************************
    // show categories on the page
    async function showCategories() {
        const res = await axios.get(`${MD_BASE_URL}/categories.php`);
        $('<div class="col-10"><h3 class="title text-center">CATEGORIES</h3></div>').appendTo($cateList);
        for (let cate of res.data.categories) {
            generateCatHTML(cate);
        } 
    }


    // *************************************************
    // generate category HTML
    function generateCatHTML(cate) {
        $(`   
            <div class="card mb-3 " style="width: 900px;">
                <div class="row no-gutters">
                    <div class="col-md-4">
                        <img src=${cate.strCategoryThumb} class="card-img" alt="No picture">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${cate.strCategory}</h5>
                            <p class="card-text">${cate.strCategoryDescription}</p>
                            <button data-cate=${cate.strCategory} class="recipesForCate btn btn-info">Recipes</button>
                        </div>
                    </div>
                </div>
            </div>                     
        `).appendTo($cateList)
    }


    // *************************************************
    // get random recipes into a list 
    async function getRandomRecipes() {
        let idLists = [];
        let randomRecipes = [];
        let res = "";
        let mealId = 0;

        for (let i = 0; i < RANDOM_NUM; i++) {
            res = await axios.get(`${MD_BASE_URL}/random.php`);
            mealId = res.data.meals[0].idMeal;           
            if (!isListHasItem(idLists, mealId)) {
                idLists.push(mealId);
                randomRecipes.push(res.data.meals[0]);
            } else {
                i--;
            }          
        }
        return randomRecipes;
    }


    // *************************************************
    // render the random recipes HTML when loading the "Recipes" page
    async function showRandomRecipes() {
        const recipes = await getRandomRecipes(); 
        await showRecipes(recipes);
        // randomShow = true;         
    }


    // ************************************************
    // get recipes by the category
    async function getRecInfosByCategory(cateName) {
        const response = await axios.get(`${MD_BASE_URL}/filter.php?c=${cateName}`);
        const recInfos = response.data.meals;
        return recInfos; 
    }


    // ************************************************
    // get recipes by the area
    async function getRecInfosByArea(area) {
        const response = await axios.get(`${MD_BASE_URL}/filter.php?a=${area}`);
        const recInfos = response.data.meals;
        return recInfos;
    }


    // ************************************************
    // get recipes by multiple categores
    async function getRecInfosForMultipleCates(catesArr) {
        let recInfos = [];
        for (let cate of catesArr) {
            let rec = await getRecInfosByCategory(cate);
            recInfos = recInfos.concat(rec);
        }
        return recInfos;
    }


    // ************************************************
    // get recipes by multiple categores
    async function getRecInfosForMultipleAreas(areasArr) {
        let recInfos = [];
        for (let area of areasArr) {
            let rec = await getRecInfosByArea(area);
            recInfos = recInfos.concat(rec);
        }
        return recInfos;
    }


    // *************************************************
    // get recipe by id
    async function getRecipeById(rec_id) {      
        const res = await axios.get(`${MD_BASE_URL}/lookup.php?i=${rec_id}`);
        return res.data.meals[0];      
    }


    // *************************************************
    // check is the item exists in the list 
    function isListHasItem(list, item) {
       if (list.length === 0 || list.indexOf(item) === -1) {
           return false;
       }  
       return true;
    }


    // *************************************************
    // show the recipes on the page 
    async function showRecipes(recipes) {
        
        for (let rec of recipes) {
            await generateRecipeHTML(rec);
        }
        currentMealList = recipes;          
    }


    // *************************************************
    // check if the recipe is liked by current user
    async function isLiked(rec_id) {
        const response = await axios.get(`/meals/${rec_id}/check-if-like`);
        // const response = await axios.get(`/meals/${rec_id}/check-if-like`);

        if (response.data.result === "like") {
            return true;
        } 
        else {
            return false; 
        }       
    } 


    // *************************************************
    // decide the style of the "like" for a recipe
    async function getLikeClass(rec) {
        const likeClass = await isLiked(rec.idMeal) ? "fas" : "far";
        return likeClass;
    }


    // *************************************************
    // generate HTML for a recipe thumbnail
    async function generateRecipeHTML(rec) {
        // don't foget "await"! otherwise the hearClass will be wrong
        const heartClass = await getLikeClass(rec);
        $(`            
            <div class="col mb-4">
                <div id=${rec.idMeal} class="recThumb card text-center h-100">
                    <img src="${rec.strMealThumb}" class="meal-image card-img-top" alt="No Picture">                    
                    <i data-recid=${rec.idMeal} class="like ${heartClass} fa-heart fa-lg mt-3 mr-3"></i>                 
                    <div class="card-body">
                        <p><b class="meal-name" >${rec.strMeal}</b></p>      
                    </div>
                </div>
            </div>       
        `).appendTo($recipes)
    }


    //**************************************************
    // get ingredients for the a recipe into a string
    function getIngredients(rec) {
        let ingredients = "";
        for (let key in rec) {
            if (key.startsWith("strIngredient") && rec[key]!=="") {
                let ingredient = rec[key];
                let messure = rec[`strMeasure${key.substring("strIngredient".length)}`];
                ingredients += `${ingredient}: ${messure}, `
            } else if (ingredients.length > 0) {
                ingredients = ingredients.substring(0, ingredients.length-2);
                ingredients += ".";
                return ingredients;
            }
        }
        return ingredients;
    } 


    // ************************************************
    // get liked recipes
    async function getLikedRecipes() {
        const response = await axios.get(`/user/likes`);
        const likedMealIds = response.data.likedMealIds;
        const likedRecipes = [];
        for (let rec_id of likedMealIds) {
            let res = await axios.get(`${MD_BASE_URL}/lookup.php?i=${rec_id}`);
            let recipe = res.data.meals[0];
            likedRecipes.push(recipe);
        }
        return likedRecipes;
    }


    //**************************************************
    // render liked recipes page
    async function showLikedRecipes() {
        const likedRecipes = await getLikedRecipes();
        await showRecipes(likedRecipes);        
    }


    // *************************************************
    //show a detailed recipe information
    async function showRecipeDetail(rec) {
        if (!rec.strCategory) {
            rec = await getRecipeById(rec.idMeal);
        }
        const heartClass = await getLikeClass(rec);
        $(`
            <div id=${rec.idMeal} class="card mb-3 " style="width: 950px;">
                <div class="row no-gutters justify-content-center">
                    <div class="col-md-4 text-right mt-4">
                        <img src="${rec.strMealThumb}" class="card-img" alt="No picture">
                    </div>
                    <div class="col-md-6">
                        <div class="card-body">
                            <h4 class="card-title text-center mt-4 mb-4">${rec.strMeal}</h4>
                            <div class="row justify-content-center mb-4">
                                <div class="col-3">
                                    <div>
                                        <button class="backBtn btn btn-sm btn-outline-success mt-2">Back</button>                                        
                                    </div>
                                </div>
                                <div class="col-7">
                                    <i data-recid=${rec.idMeal} class="like ${heartClass} fa-heart fa-lg mt-2 mr-3">
                                    </i>                                    
                                    
                                    <!-- Trigger the modal with a button -->
                                    <button type="button" class="addToMealPlanBtn btn btn-sm btn-warning mt-2" data-toggle="modal" data-target="#addToMealPlanFormModal">Add to My Meal Plan</button>
                                    <button class="backToMealPlanBtn btn btn-warning mt-2 d-none">My Meal Plan</button>
                                    <!-- Modal -->
                                    <div class="modal fade" id="addToMealPlanFormModal" role="dialog">
                                        <div class="modal-dialog">                                        
                                            <!-- Modal content-->
                                            <div class="modal-content">
                                                <div class="modal-header">                                    
                                                    <h4 class="modal-title text-center">Add <span class="text-danger">${rec.strMeal} </span>to My Meal Plan</h4>
                                                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                                                </div>
                                                <div class="modal-body">
                                                    <form action="">
                                                        <input type="hidden" id="mealId" name="mealId" value=${rec.idMeal}>
                                                        <div class="form-group">
                                                            <label for="day"><b>Select Day</b></label>
                                                            <select class="form-control" id="day"></select>
                                                        </div>
                                                        <div class="form-group">
                                                            <label for="mealType"><b>Select Meal Type</b></label>
                                                            <select class="form-control" id="mealType"></select>
                                                        </div>
                                                        <div class="modal-footer">
                                                            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                                                            <button class="add-to-mealplan-btn btn btn-success">Add</button>
                                                        </div>
                                                    </form>
                                                </div>                                          
                                            </div>                                        
                                        </div>
                                    </div>
                                    <!-- end Modal -->

                                </div>
                            </div>
                            <div class="row justify-content-center mb-2">
                                <div class="col-3">
                                    <p class="card-text"><b>Category: </b></p>
                                </div>
                                <div class="col-7">
                                    <p class="card-text">${rec.strCategory}</p>
                                </div>
                            </div>
                            <div class="row justify-content-center mb-2">
                                <div class="col-3">
                                    <p class="card-text"><b>Area: </b></p>
                                </div>
                                <div class="col-7">
                                    <p class="card-text">${rec.strArea}</p>
                                </div>
                            </div>
                            <div class="row justify-content-center mb-2">
                                <div class="col-3">
                                    <p class="card-text"><b>Tags: </b></p>
                                </div>
                                <div class="col-7">
                                    <p class="card-text">${rec.strTags}</p>
                                </div>
                            </div>
                            <div class="row justify-content-center mb-2">
                                <div class="col-3">
                                    <p class="card-text"><b>Viedo: </b></p>
                                </div>
                                <div class="col-7">
                                    <a class="card-text vedioLink font-italic" href="${rec.strYoutube}" target="_blank">Watch the recipe vedio on YouTube</a>
                                </div>
                            </div>                               
                        </div>
                    </div>
                </div>

                <div class="row no-gutters justify-content-center mt-4">
                    <div class="col-10">
                        <p class="card-text font-italic"><b>Ingredients: </b></p>
                        <p>${getIngredients(rec)}</p>
                    </div>
                </div>

                <div class="row no-gutters justify-content-center mt-4">
                    <div class="col-10">
                        <p class="card-text font-italic"><b>Instruction: </b></p>
                        <p>${rec.strInstructions}</p>
                    </div>
                </div>
            </div>    
        `).appendTo($recipeDetail);
        
        generateMealPlanFormOptions();
    }


    // *************************************************
    // generate Add to Meal Plan Form options
    function generateMealPlanFormOptions() {
        for (let d of days) {
            $(`<option>${d}</option>`).appendTo($("#day"));
        }
        
        for (let m of mealType) {
            $(`<option>${m}</option>`).appendTo($("#mealType"));
        }
    }


    // *************************************************
    // get all the categories into a list
    async function getCatsList() {
        const res = await axios.get(`${MD_BASE_URL}/list.php?c=list`);
        const catsList = res.data.meals.map(i => i.strCategory);
        return catsList;
    }


    // *************************************************
    // get all areas into a list
    async function getAreasList() {
        const res = await axios.get(`${MD_BASE_URL}/list.php?a=list`);
        const areasList = res.data.meals.map(i => i.strArea);
        return areasList;
    }


    // *************************************************
    // generate the filter checkbox HTML 
    function generateFilterItemHTML(item, $filter) {       
        $(`
            <div class="form-check mr-3">
                <input class="form-check-input" type="checkbox" id="${item}" name="${item}" value="${item}">
                <label class="form-check-label" for="${item}">${item}</label>
            </div>
        `).appendTo($filter);     
    }


    // *************************************************
    // show the filter by category on page
    async function showCatFilter() {
        const cates = await getCatsList();
        for (let cate of cates) {
            generateFilterItemHTML(cate, $("#catFilter"));
        }
    }


    // *************************************************
    // show the filter by area on page
    async function showAreaFilter() {
        const areas = await getAreasList();
        for (let a of areas) {
            generateFilterItemHTML(a, $("#areaFilter"));
        }
    }


    // ************************************************
    // collect the selected filter item in Category 
    function getSelectedCateFilterItems() {
        let i = 0;
        let selected = [];
        $('#catFilter input:checked').each(function () {            
            selected[i++] = $(this).val();
        });  
        return selected;
    }


    // ************************************************
    // collect the selected filter item in Area 
    function getSelectedAreaFilterItems() {
        let i = 0;
        let selected = [];
        $('#areaFilter input:checked').each(function () {
            selected[i++] = $(this).val();
        });
        return selected;
    }


    // *************************************************
    // search the recipes by name, and store them in a list
    async function getRecsByName(name) {
        const res = await axios.get(`${MD_BASE_URL}/search.php?s=${name}`); 
        const mealList = res.data.meals;
        return mealList;
    }


    // *************************************************
    // show the "No Results Found" page
    function showNoResultsFound(name) {     
        $(`
            <div class="alert alert-warning" role="alert">
                <h5>We were not able to find any recipes that match
                <span class="text-danger">${name}.</span></h5>
            </div>           
        `).appendTo($noResults);        
    }


    // ************************************************
    // find the recipe from the surrent stored recipes list by id
    function getRecFromCurentList(rec_id) {
        for (let rec of currentMealList) {
            if (rec.idMeal === rec_id || rec.id === rec_id) {
                return rec;
            }
        }
    }


    // ***************************************************
    // find the recipes in both 2 arrays, the complete recipe goes to arr1
    function recsInBothArrs(arr1, arr2) {
        const intersectRecs = arr1.filter(a => arr2.some(b => a.idMeal === b.idMeal));
        return intersectRecs;
    }


    // ***************************************************
    // get recipes filtered by the checked items from the checkboxes
    async function getRecsFromFilterCheckboxes() {
        const selectedCates = getSelectedCateFilterItems();
        const selectedAreas = getSelectedAreaFilterItems();
        const recsByAreas = await getRecInfosForMultipleAreas(selectedAreas);
        const recsByCates = await getRecInfosForMultipleCates(selectedCates);

        if (selectedCates.length === 0 && selectedAreas.length===0) {
            return "no filter";
        }
        else if (selectedCates.length === 0) {            
            return recsByAreas;
        }
        else if (selectedAreas.length === 0) {            
            return recsByCates;
        }
        else {
            const filteredRecs = recsInBothArrs(recsByCates, recsByAreas); 
            return filteredRecs;
        }
    }


    // ************************************************
    // clear all checkboxes in filters
    function clearAllFilters() {
        $('input:checkbox').each(function () {
            this.checked = false;
        }); 
    }


    // ************************************************
    // get DIY recipes from database
    async function getDiyList() {
        const response = await axios.get(`/diy_recipes`);
        return response.data.diyRecipes;        
    }


    // ************************************************
    // get a DIY recipe by ID
    async function getDiyRecById(id) {
        const response = await axios.get(`/diy_recipes/${id}`);
        return response.data.diy_recipe;
    }

        
    // ************************************************
    //generate DIY recipes HTML
    function generateDiyRecipeHTML(rec){
        $(` 
            <li data-recid=${rec.id} class="list-group-item">
                <i class="diyDelete far fa-trash-alt mr-2 btn"></i>
                <a class="diyRecipeLink btn">${rec.name}</a>                    
            </li>`       
        ).appendTo($diyList)
    }


    // *************************************************
    // show DIY recipes on the page
    async function showDiyRecipes() {
        const diyRecipes = await getDiyList(); 

        for (let rec of diyRecipes) {
            generateDiyRecipeHTML(rec);
        }
        currentMealList = diyRecipes;
    }


    // ************************************************
    // show single DIY recipe detail
    function showDiyRecDetail(diyRec) {
        $(`
            <div class="card mb-3" style="max-width: 800px; min-height: 400px;">
                <div class="row no-gutters">
                    <div data-recid=${diyRec.id} class="col-md-4 m-3 text-center">
                        <img src="${diyRec.image_url}" onerror="this.src='static/images/recipe.png'"class="card-img mb-3" alt="">
                        <span class="back-to-diy-list btn btn-outline-info">Back</span>
                        <span class="editDiyBtn btn btn-success mx-3">Edit</span>
                        <span class="diyDelete btn btn-secondary">Delete</span>
                    </div>
                    <div class="col-md-7">
                        <div class="card-body">
                            <h5 class="card-title text-center">${diyRec.name}</h5>

                            <div class="text-center">
                                <!-- Trigger the modal with a button -->
                                <button type="button" class="addToMealPlanBtn btn btn-sm btn-warning mt-2" data-toggle="modal" data-target="#addToMealPlanFormModal2">Add to My Meal Plan</button>
                                <button class="backToMealPlanBtn btn btn-warning mt-2 d-none">My Meal Plan</button>
                                <!-- Modal -->
                                <div class="modal fade" id="addToMealPlanFormModal2" role="dialog">
                                    <div class="modal-dialog">
                                        <!-- Modal content-->
                                        <div class="modal-content">
                                            <div class="modal-header text-center">
                                                <h4 class="modal-title">Add <span class="text-danger">${diyRec.name} </span>to My Meal Plan</h4>
                                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                                            </div>
                                            <div class="modal-body">
                                                <form action="" class="text-left">
                                                    <input type="hidden" id="mealId" name="mealId" value="d-${diyRec.id}">
                                                    <div class="form-group">
                                                        <label for="day"><b>Select Day</b></label>
                                                        <select class="form-control" id="day"></select>
                                                    </div>
                                                    <div class="form-group">
                                                        <label for="mealType"><b>Select Meal Type</b></label>
                                                        <select class="form-control" id="mealType"></select>
                                                    </div>
                                                    <div class="modal-footer">
                                                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                                                        <button class="add-to-mealplan-btn btn btn-success data-dismiss="modal"">Add</button>
                                                    </div>
                                                </form>
                                            </div>                                          
                                        </div>                                        
                                    </div>
                                </div>
                                <!-- end Modal -->
                            </div>

                            <b>Ingredients:</b>
                            <p class="card-text">${diyRec.ingredients}</p>
                            <b>Description:</b>
                            <p class="card-text">${diyRec.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        `).appendTo($diyRecipeDetail);

        generateMealPlanFormOptions();
    }


    // *************************************************
    // generate Meal Plan table
                          
    function drawMealPlanTable() { 
        $(`
            <h3 class="title text-center">WEEKLY MEAL PLAN</h3>
            <div class="row justify-content-center">
                <div class="col-12 table-responsive">
                    <table id="mealPlanTable" class="table table-hover table-bordered table-sm table-fixed">
                        <thead class="thead-dark">
                            <tr id="mpTHead">
                                <th scope="col" class="text-center">Meal</th>
                            </tr>
                        </thead>
                        <tbody id="mpTbody"></tbody>
                    </table>
                </div>
            </div>
        `).appendTo($mealPlan);
      
        for (let m of mealType) {
            $(`<th scope="col" class="tbHeader text-center">${m}</th>`).appendTo($("#mpTHead"));
        }

        for (let d of days) {
            let $tr = $(`<tr id=${d} class="table-primary"></tr>`);
            $(`<th scope="row" class="table-secondary w-20 text-center align-middle">${d}</th>`).appendTo($tr);
            for (let m of mealType) {
                $(`<td id="${d}-${m}" class="w-20"></td>`).appendTo($tr);
            }
            $tr.appendTo($("#mpTbody"));
        } 
    }


    // *************************************************
    // fetch the Meal Plan data and show the filled Meal Plan table
    async function fillMealPlanTable(){
        const res = await axios.get(`/mealplan`);
        const mealPlan = res.data.meal_plan_list;
        let cellId;
        let mealId;
        let mealPlanId;
        let mealName;
        for(let m of mealPlan) {
            cellId = `${m.day}-${m.meal_type}`;
            mealId = m.meal_id;
            mealPlanId = m.id
            mealName = await getRecNameByIdInMealPlan(mealId);        
               
            $(`
                <div id="mp-${mealPlanId}" class="mb-2">
                    <i class="deleteMealOnPlanBtn fas fa-times-circle btn"></i>
                    <a href="#" data-mealid=${mealId} data-mealplanid=${mealPlanId} class="mealPlanLink">${mealName}</a>
                </div>`
            ).appendTo($(`#${cellId}`));
        }
    }


    // *************************************************
    // get recipe name by the meal id stored in the Meal Plan DB
    // the recipe will be either the recipe form theMealDB API, or from DIY recipes
    async function getRecNameByIdInMealPlan(mealId) {
        let mealRecipe;
        if (mealId[0] === "d") {
            mealRecipe = await getDiyRecById(mealId.substring(2));         
            return mealRecipe.name;            
        }
        else {
            mealRecipe = await getRecipeById(mealId);    
            return mealRecipe.strMeal;            
        }       
    }


    // *************************************************
    // show detailed recipe page by the meal id stored in the Meal Plan DB
    // the recipe will be either the recipe form theMealDB API, or from DIY recipes
    async function showRecPageByIdInMealPlan(mealId) {
        cleanUp();
        let mealRecipe;
        if (mealId[0] !== "d") {
            mealRecipe = await getRecipeById(mealId)
            await showRecipeDetail(mealRecipe);  
        }
        else {
            mealRecipe = await getDiyRecById(mealId.substring(2));
            showDiyRecDetail(mealRecipe);
        }
    }


    // *************************************************
    // load Meal Plan page
    async function loadMealPlanPage() {
        cleanUp();
        // show($mealPlan);
        drawMealPlanTable();
        setColorBgForMealPlanTable();
        await fillMealPlanTable();
        
    }


    // *************************************************
    // show the part
    function show($div) {
        $div.removeClass('d-none');
    }


    // *************************************************
    // hide the part
    function hide($div) {
        $div.addClass('d-none');
    }
 

    //**************************************************
    // Show the loading spinner before the content loaded
    function showLoadingView() {
        $loader.css("display", "block");
    }


    //**************************************************
    // Remove the loading spinner
    function hideLoadingView() {
        $loader.css("display", "none");
    }


    // *************************************************
    // empty the previous contents before refreshing
    function cleanUp() {
        hide($home);
        hide($welcome);
        $cateList.empty();
        hide($recipesArea);  
        // hide($recipesSearchArea);    
        $recipes.empty(); 
        $noResults.empty();       
        $recipeDetail.empty();  
        hide($addOrEditDiy); 
        hide($diyRecipes);
        $diyList.empty();
        $diyRecipeDetail.empty();
        $mealPlan.empty();
    }

    // *************************************************
    // load recipes page
    async function loadRecipesPage() {
        cleanUp();
        show($recipesArea);
        show($recipesSearchArea);
        clearAllFilters();
        $searchInput.val("");
        hide($filters);
        $recTitle.html(`<h5><b>POPULAR RECIPES</b></h5><hr>`);
        showLoadingView();
        await showRandomRecipes();
        hideLoadingView();
        // searchResultShowed = false;   
        searchedResults = [];
    }

    // *************************************************
    // load DIY recipes page
    async function loadDiyRecipesPage() {
        cleanUp();
        show($diyRecipes);
        await showDiyRecipes();
    }


    // ********************************************
    // show add new DIY recipe form
    function showAddNewDiyForm() {
        cleanUp();
        show($addOrEditDiy);        
        $("#diy-form-title").text("Add New DIY Recipe");
        $recName.val("");
        $imgURL.val("");
        $recIngredients.val("");
        $recDescription.val("");
        $("#submitNewDiyBtn").removeClass('d-none');
        $("#submitEditDiyBtn").addClass('d-none');
    }


    // ********************************************
    // show edit DIY recipe form
    function showEditDiyForm() {
        cleanUp();
        show($addOrEditDiy);
        $("#diy-form-title").text("Edit Your Recipe");
        $("#submitNewDiyBtn").addClass('d-none');
        $("#submitEditDiyBtn").removeClass('d-none');
    }


    // *************************************************
    // handle the "Category" tab on the navbar
    $("#catNav").on('click', async function(){
        cleanUp();
        showLoadingView();       
        await showCategories();   
        hideLoadingView();    
    })


    // *************************************************
    // handle the "Recipes" tab on the navbar an the buttons
    $("#recNav").on('click', loadRecipesPage)

    $("#gotoRecipes").on('click', loadRecipesPage);


    // *************************************************
    // handle the "DIY Recipes" tab on the navbar
    $("#diyNav").on('click', async function(){
        await loadDiyRecipesPage();
    })


    // *************************************************
    // handle the "My Meal Plan" tab on the navbar and the buttons
    $("#mealPlanNav").on('click', loadMealPlanPage);

    $("#gotoMealPlan").on('click', loadMealPlanPage);


    // ************************************************
    // handle "deleting" DIY recipes
    $recipesContainer.on('click', '.diyDelete', async function(e){       
        if (confirm("Are you sure to delete?")) {
            const diyRecId = $(e.target).parent().data('recid');
            await axios.post(`/diy_recipes/${diyRecId}/delete`)
            cleanUp();
            show($diyRecipes);
            await showDiyRecipes();
        }       
    })


    // ************************************************
    // handle recipes button for each category
    $cateList.on('click', '.recipesForCate', async function(e){
        const cate = $(e.target).data('cate');       
        cleanUp();
        const recInfos = await getRecInfosByCategory(cate); 
        show($recipesArea); 
        hide($('#recipesSearchArea')); 
        $recTitle.html(`<h5><b>RECIPES for <span class="text-info">${cate}</span></b></h5><hr>`);
        showLoadingView();                
        await showRecipes(recInfos);
        hideLoadingView();               
    })


    // *************************************************
    // handle the "My Favorite Recipes" tab in navbar
    $("#likesNav").on('click', async function () {
        cleanUp();
        show($recipesArea);
        hide($recipesSearchArea);   
        show($recTitle);
        $recTitle.html(`<h3 class="text-center">MY FAVORITE RECIPES</h3><hr>`);
        showLoadingView();        
        await showLikedRecipes(); 
        hideLoadingView();                     
    })


    // *************************************************
    // handle the "Filter By" button
    $("#filterByBtn").on('click', function(){
        $filters.toggleClass("d-none");
    })


    // *************************************************
    // handle the "Clear All" button in the filter area
    $("#clearFiltersBtn").on('click', clearAllFilters);


    // *************************************************
    // handle the recipe search form 
    $("#searchForm").on('click', 'button', async function(e){
        // e.preventDefault();        

        const name = $searchInput.val();
        if (name === "") return;       

        const meals = await getRecsByName(name);

        cleanUp();
        show($recipesArea);
        clearAllFilters();   

        if (!meals) {
            $recTitle.html("");
            showNoResultsFound(name);
        }
        else {       
            $recTitle.html(`<h5><b>SEARCH RECIPES for <span class="text-info">${name}</span></b></h5><hr>`);
            showLoadingView(); 
            await showRecipes(meals);
            hideLoadingView();            
        } 
        searchedResults = meals;
    })


    //**************************************************
    // handle the search filter form 
    $("#filterForm").on('submit', async function (e) {
        e.preventDefault();

        let filteredRecs = await getRecsFromFilterCheckboxes();

        if (filteredRecs === "no filter") {
            return;
        }

        // if there is searched results showed from previous search, 
        // filters applied for current showed recipes
        if (searchedResults.length > 0) {
            filteredRecs = recsInBothArrs(searchedResults, filteredRecs);
        }
        else {
            $recTitle.html("");
        }

        cleanUp();
        show($recipesArea);      

        if (filteredRecs.length===0) {           
            showNoResultsFound("");            
        } 
        else {
            showLoadingView();
            await showRecipes(filteredRecs);
            hideLoadingView(); 
        }       
    })


    // ***************************************************
    // show detail of the recipe when clicking on the recipe image
    $recipes.on('click', '.meal-image', async function(e){
        const recId = $(e.target).parent().attr("id");       
        const rec = getRecFromCurentList(recId);      
        cleanUp();
        hide($recTitle);   
        await showRecipeDetail(rec);       
    })


    //**************************************************
    // handle "back" button on each recipe detail page. 
    // back to the previous recipes page
    $recipeDetail.on('click','.backBtn', async function(e){
        cleanUp();
        show($recipesArea);
        // $recipes.removeClass("d-none");  
        await showRecipes(currentMealList); 
        show($recTitle);       
    })
    // can not do this:
    // $(".backBtn").on('click', function() { 
    //     ...
    // })


    //**************************************************
    // handle the like/unlike 
    $recipesContainer.on('click', '.like', async function(e){
        const rec_id = $(e.target).data('recid');
        await axios.post(`/meals/${rec_id}/like`);    
        $(e.target).toggleClass('fas far');
    })


    // *************************************************
    // handle "Add New DIY Recipe" button
    $("#addDiyBtn").on('click', showAddNewDiyForm);


    // *************************************************
    // handle submit new DIY recipe form
    $("#submitNewDiyBtn").on('click', async function(e){
        e.preventDefault();
        const name = $recName.val();
        const imgURL = $imgURL.val();
        const ingredients = $recIngredients.val();
        const description = $recDescription.val();
        await axios.post(`/diy_recipes/new`, {
            name,
            imgURL,
            ingredients,
            description
        })
        await loadDiyRecipesPage();
    })


    // *************************************************
    // handle submit edit DIY recipe form
    $("#submitEditDiyBtn").on('click', async function (e) {
        e.preventDefault();
        const name = $recName.val();
        const imgURL = $imgURL.val();
        const ingredients = $recIngredients.val();
        const description = $recDescription.val();
        await axios.post(`/diy_recipes/${$("#diy-rec-id").val()}/edit`, {
            name,
            imgURL,
            ingredients,
            description
        })
        await loadDiyRecipesPage();
    })
    

    // **************************************************
    // handle "back" (no submitting) button
    $recipesContainer.on('click', '.back-to-diy-list', async function(){
        await loadDiyRecipesPage();
    })


    // **************************************************
    // show DIY recipe detail by clicking the recipe link
    $diyList.on('click', '.diyRecipeLink', function(e){
        const diyRecId = $(e.target).parent().data('recid');
        const diyRec = getRecFromCurentList(diyRecId);
        cleanUp();    
        showDiyRecDetail(diyRec);   
    })


    //**************************************************
    // handle showing edit DIY recipe form
    $diyRecipeDetail.on('click', '.editDiyBtn', async function(e){
        const diyRecId = $(e.target).parent().data('recid');        
        const res = await axios.get(`/diy_recipes/${diyRecId}`)
        const diyRec = res.data.diy_recipe;
        showEditDiyForm();
        $recName.val(diyRec.name);
        $imgURL.val(diyRec.image_url);
        $recIngredients.val(diyRec.ingredients);
        $recDescription.val(diyRec.description);  
        $("#diy-rec-id").val(diyRecId);      
    }) 


    // *************************************************
    // handle submit add to Meal Plan form
    $recipesContainer.on('click', '.add-to-mealplan-btn', async function(e){
        e.preventDefault();

        const day = $("#day").val();  
        const mealType = $("#mealType").val();
        const mealId = $("#mealId").val(); 

        await axios.post(`/mealplan`, {    
            day,
            mealType,
            mealId
        })
        $('.modal-backdrop').remove();
        $("body").removeClass('modal-open');

        await loadMealPlanPage();
    })


    // *************************************************
    // get the recipe detail by clicking the meal plan link
    $('#mealPlan').on('click', '.mealPlanLink', async function(e){
        const mealId = $(e.target).data('mealid');    
        
        cleanUp();        
        await showRecPageByIdInMealPlan(mealId);         
      
        hide($(".backBtn"));
        hide($(".addToMealPlanBtn"));
        show($(".backToMealPlanBtn"));
    })


    // *************************************************
    // from recipe detail page back to Meal Plan
    $recipesContainer.on('click', '.backToMealPlanBtn', loadMealPlanPage);


    // *************************************************
    // handle the delete button for each meal on the Meal Plan
    $mealPlan.on('click', '.deleteMealOnPlanBtn', async function(e){
        if (confirm("Are you sure to delete?")) {
            const mealPlanId = $(e.target).next().data("mealplanid");
            await axios.post(`/mealplan/${mealPlanId}/delete`);       
            $(`#mp-${mealPlanId}`).remove();  
        }        
    })
    

    // *************************************************
    // get Day of today
    function getDayofToday() {
        const d = new Date();
        const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return weekday[d.getDay()];        
    }


    // *************************************************
    // get Day of today, and highlight the today's meal plan
    function setColorBgForMealPlanTable() {
        const dayOfToday = getDayofToday();
        const $trs = $("#mpTbody tr");
        
        for (let $tr of $trs) {          
            if ($tr.id === dayOfToday) {                
                $($tr).addClass("table-info");     
                $($tr).removeClass("table-primary");     
            }
            else {
                $($tr).addClass("table-primary"); 
                $($tr).removeClass("table-info");              
            }
        }        
    }


    // *************************************************
    // when loading the page ...
    async function setUp() {
        await showCatFilter();
        await showAreaFilter(); 
        show($home);
        // drawMealPlanTable();
        // generateMealPlanFormOptions();
    }


    setUp();
    
});




