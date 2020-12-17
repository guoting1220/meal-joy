$(async function () {

    const MD_BASE_URL = "https://www.themealdb.com/api/json/v1/1";
    const LOCAL_HOST = "http://127.0.0.1:5000";
    const RANDOM_NUM = 12;

    let currentMealList = [];
    let searchedResults = [];



    // *************************************************
    // show categories on the page
    async function showCategories() {
        const res = await axios.get(`${MD_BASE_URL}/categories.php`);

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
        `).appendTo($("#cat-list"))
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
        const response = await axios.get(`${LOCAL_HOST}/meals/recipes/${rec_id}/check-if-like`);
        // const response = await axios.get(`/meals/recipes/${rec_id}/check-if-like`);

        if (response.data.result === "like") {
            return true;
        } 
        else {
            return false; 
        }       
    } 


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
                <div id=${rec.idMeal} class="recThumb card text-center">
                    <img src="${rec.strMealThumb}" class="meal-image card-img-top" alt="No Picture">                    
                    <i data-recid=${rec.idMeal} class="like ${heartClass} fa-heart fa-lg mt-3 mr-3"></i>                 
                    <div class="card-body">
                        <p><b class="meal-name" >${rec.strMeal}</b></p>      
                    </div>
                </div>
            </div>       
        `).appendTo($("#recipes"))
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
        const response = await axios.get(`http://127.0.0.1:5000/user/likes`);
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
                                    <a class="card-text vedioLink font-italic" href="${rec.strYoutube}">Watch the recipe vedio on YouTube</a>
                                </div>
                            </div>   
                            <div class="row justify-content-center mb-2">
                                <div class="col-3">                       
                                <i data-recid=${rec.idMeal} class="like ${heartClass} fa-heart fa-lg mt-3 mr-3"></i> 
                                </div>
                                <div class="col-7">
                                    <div>
                                        <button class="backBtn btn btn-success mt-2">Back</button>
                                    </div>
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
        `).appendTo($("#recipeDetail"));
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
        `).appendTo($("#noResults"));        
    }


    // ************************************************
    // find the recipe from the surrent stored recipes list by id
    function getRecFromCurentList(rec_id) {
        for (let rec of currentMealList) {
            if (rec.idMeal === rec_id) {
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


    // show the recipe area
    function displayRecipeArea() {     
        $("#recipesArea").removeClass('d-none');
    }

    // *************************************************
    // handle like toggling
    // function handleLikeToggling(){
    //     const response = await axios.post(`/meals/recipes/<int:rec_id>/like`);   
    // }

    //**************************************************
    // Show the loading spinner before the content loaded
    function showLoadingView() {
        $("#loader").css("display", "block");
    }


    //**************************************************
    // Remove the loading spinner
    function hideLoadingView() {
        $("#loader").css("display", "none");
    }


    // *************************************************
    // empty the previous contents before refreshing
    function cleanUp() {
        $("#home").addClass('d-none');
        $("#welcome").addClass("d-none");
        $("#cat-list").empty();
        $("#recipesArea").addClass('d-none');
        $("#recipes").empty(); 
        $("#noResults").empty();       
        $("#recipeDetail").empty();   
    }


    async function loadRecipesPage() {
        cleanUp();
        displayRecipeArea();
        clearAllFilters();
        $("#rSearch").val("");
        $("#filters").addClass("d-none");
        $("#recTitle").html(`<h5><b>POPULAR RECIPES</b></h5><hr>`);
        showLoadingView();
        await showRandomRecipes();
        hideLoadingView();
        // searchResultShowed = false;   
        searchedResults = [];
    }

    $("#home-search").on('click', loadRecipesPage);


    // *************************************************
    // handle the "Category" tab on the navbar
    $("#catNav").on('click', async function(){
        cleanUp();
        showLoadingView();       
        await showCategories();   
        hideLoadingView();    
    })


    // *************************************************
    // handle the "Recipes" tab on the navbar
    $("#recNav").on('click', loadRecipesPage)


    // ************************************************
    // handle recipes button for each category
    $("#cat-list").on('click', '.recipesForCate', async function(e){
        const cate = $(e.target).data('cate');       
        cleanUp();
        const recInfos = await getRecInfosByCategory(cate); 
        displayRecipeArea(); 
        $('#recipesSearchArea').addClass('d-none'); 
        $("#recTitle").html(`<h5><b>RECIPES for <span class="text-info">${cate}</span></b></h5><hr>`);
        showLoadingView();                
        await showRecipes(recInfos);
        hideLoadingView();               
    })


    // *************************************************
    // handle the "My Favorite Recipes" tab in navbar
    $("#likesNav").on('click', async function () {
        cleanUp();
        displayRecipeArea();
        $("#recTitle").html(`<h5><b>MY FAVORITE RECIPES </b></h5><hr>`);
        showLoadingView();        
        await showLikedRecipes(); 
        hideLoadingView();                     
    })


    // *************************************************
    // handle the "Filter By" button
    $("#filterByBtn").on('click', function(){
        $("#filters").toggleClass("d-none");
    })


    // *************************************************
    // handle the "Clear All" button in the filter area
    $("#clearFiltersBtn").on('click', clearAllFilters);


    // *************************************************
    // handle the recipe search form 
    $("#searchForm").on('click', 'button', async function(e){
        e.preventDefault();        

        const name = $("#rSearch").val();
        if (name === "") return;       

        const meals = await getRecsByName(name);

        cleanUp();
        displayRecipeArea();
        clearAllFilters();   

        if (!meals) {
            $("#recTitle").html("");
            showNoResultsFound(name);
        }
        else {       
            $("#recTitle").html(`<h5><b>SEARCH RECIPES for <span class="text-info">${name}</span></b></h5><hr>`);
            showLoadingView(); 
            // const filteredRecs = await getRecsFromFilterCheckboxes();
            // await showRecipes(recsInBothArrs(meals, filteredRecs)); 
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
            $("#recTitle").html("");
        }

        cleanUp();
        displayRecipeArea();      

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
    $("#recipes").on('click', '.meal-image', async function(e){
        const recId = $(e.target).parent().attr("id");       
        const rec = getRecFromCurentList(recId);      
        // $("#recipes").addClass("d-none"); 
        cleanUp();
        $("#recTitle").addClass('d-none');   
        await showRecipeDetail(rec);       
    })


    //**************************************************
    // handle "back" button on each recipe detail page. 
    // back to the previous recipes page
    $("#recipeDetail").on('click','.backBtn', async function(e){
        cleanUp();
        displayRecipeArea();
        // $("#recipes").removeClass("d-none");  
        await showRecipes(currentMealList); 
        $("#recTitle").removeClass('d-none');       
    })
    // can not do this:
    // $(".backBtn").on('click', function() { 
    //     ...
    // })


    //**************************************************
    // handle the like/unlike 
    $("#recipesContainer").on('click', '.like', async function(e){
        const rec_id = $(e.target).data('recid');
        await axios.post(`${LOCAL_HOST}/meals/recipes/${rec_id}/like`);    
        $(e.target).toggleClass('fas far');
    })


    await showCatFilter();
    await showAreaFilter(); 
    $("#home").removeClass('d-none');
});




