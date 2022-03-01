window.onload = function() {
    var func = document.querySelector("[data-func]");
    if(func){
        document.documentElement.setAttribute("class",func.getAttribute("data-func"));
    };
    deleteButton();
};

//jump page
function page(url){
    loading();
    function back(e){
        var parse = new DOMParser();
        var html = parse.parseFromString(e.data,"text/html");
        if(!html.querySelector(".setting")){
            history.go(0);
            return;
        };

        document.querySelector(".setting").innerHTML = html.querySelector(".setting").innerHTML;
        history.pushState("","",url);
        deleteButton();
        loadingClose();
    };
    asyncAjax(location.origin + url,back,true);
};

//async ajax
function asyncAjax(url,back,async){
    //url 路徑
    //back is call back function
    //async 非同步

    if(!back){
        console.log("missing back function!");
        return;
    };

    if(!async || !typeof(Worker)){

        if(async && !typeof(Worker)){
            console.log("Web Worker not supported to use XMLHttpRequest!");
        };

        var XML = new XMLHttpRequest();
        XML.onload = function() {
            if(this.readyState == 4 && this.status == 200){
                back(this);
            };
        };
        XML.open("GET", url + "?" + Math.floor(Math.random()*1000));
        XML.send();
    }else{
        var worker = new Worker("/javascript/worker.js");
        worker.postMessage(["asyncAjax",url]);
        worker.onmessage = function(e){
            back(e);
        };
    };
};

//loading
function loading(){
    
    var InpBox = document.createElement("div");
    InpBox.setAttribute("id","loading");
    
    var loading = document.createElement("img");
    loading.src = "/images/loading.svg";

    InpBox.appendChild(loading);

    document.body.appendChild(InpBox);
    
};

function loadingClose(){
    document.querySelector("#loading").remove();
};

//delete button
function deleteButton(){
    var obj = document.querySelector('#data-panel')
    if(obj){
        obj.addEventListener('click', function(event) {
            var target = event.target

            var dname = target.dataset.name;

            if(!dname){return;};

            var category   = target.dataset.category;
            var entity     = target.dataset.entity;
            var cpnyid     = target.dataset.cpnyid;
            var table      = target.dataset.table;
            var id         = target.dataset.id;
            var categoryid = target.dataset.categoryid;
            var functionid = target.dataset.functionid;

            var action;           
        
            if(target.id == "delete-btn"){
                document.querySelector('#delete-position').innerText = "「" + dname + "」";
                action = "/" + category + "/" + entity;
            };
        
            if(target.id == "adminSearch-delete-btn"){
                document.querySelector('#delete-position').innerText = "「" + cpyname + "的" + dname + "」";
                action = "/" + category + "/" + cpnyid + "/" + table + "/" + id;
            };

            if(target.id == "delete-function-btn"){
                document.querySelectorAll('#delete-function').forEach(function(item){
                    item.innerText = "「" + dname + "」";
                });
                action = "/" + category + "/" + id + "/" + categoryid;
            };

            if(target.id == "delete-question-btn"){
                document.querySelectorAll('#delete-question').forEach(function(item){
                    item.innerText = "「" + dname + "」";
                });
                action = "/" + category + "/" + id + "/" + functionid;
                if(categoryid){
                    action += "/" + categoryid;
                };
            };

            if(target.id == "delete-question-admin-btn"){
                document.querySelectorAll('#delete-question').forEach(function(item){
                    item.innerText = "「" + dname + "」";
                })
                action =  "/" + category + "/" + id + "/" + functionid;
            };

            if(target.id == "admin-delete-user-btn"){
                document.querySelector('#delete-position').innerText = "「" + dname + "」";
                action =  "/" + category + "/" + dname + "/" + id;
            };

            document.querySelector('#delete-form').action = action + "?_method=DELETE";
        });
    };
};
