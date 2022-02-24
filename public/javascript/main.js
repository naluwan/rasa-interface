window.onload = function() {
    if(document.querySelector("[data-func]")){
        var pageName = document.querySelector("[data-func]").getAttribute("data-func");
        document.documentElement.setAttribute("class",pageName);
    };
    deleteButton();
};

function page(url){
    loading();
    function back(e){
        console.log(e)
        var html = e.data;
        var parse = new DOMParser();
        var htmlDoc = parse.parseFromString(html,"text/html");
        
        if(!htmlDoc.querySelector(".setting")){
            history.go(0);
            return;
        };

        document.querySelector(".setting").innerHTML = htmlDoc.querySelector(".setting").innerHTML;
        history.replaceState("","",url);
        deleteButton();
        loadingClose();
    };
    asyncAjax(location.origin + url,back,true);
};

//ajax
function asyncAjax(url,back,async){
    console.log(url)
    //url 路徑
    //back function =>  var back = function(value){console.log(value);};
    //async 多線程(可無)

    if(!back){
        console.log("missing back function!");
    };

    if(!async){
        var XML = new XMLHttpRequest();
        XML.onload = function() {
            if(this.readyState == 4 && this.status == 200){
                back(this);
            };
        };
        XML.open("GET", url + "?" + Math.floor(Math.random()*1000));
        XML.send();
    }else{

        if(!typeof(Worker)){
            console.log("Web Worker not support!");
            return;
        };

        var worker = new Worker("/javascript/worker.js");
        worker.postMessage(["asyncAjax",url]);
        worker.onmessage = function(e){
            back(e);
        };
    };
};

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

function deleteButton(){
    var obj = document.querySelector('#data-panel')
    if(obj){
        obj.addEventListener('click', event => {
            var target = event.target
            var deleteForm = document.querySelector('#delete-form');
            var deletePosition;

            var name = target.dataset.name;
            var category = target.dataset.category;
            var entity = target.dataset.entity;
            var cpnyid = target.dataset.cpnyid;
            var table = target.dataset.table;
            var id = target.dataset.id;
            var categoryid = target.dataset.categoryid;
            var functionid = target.dataset.functionid;
            var action;

            console.log(target)
        
            if(target.id == "delete-btn"){
                document.querySelector('#delete-position').innerText = "「" + name + "」";
                action = "/" + category + "/" + entity;
            };
        
            if(target.matches('#adminSearch-delete-btn')){
                document.querySelector('#delete-position').innerText = '「' + cpyname + '的' + name + '」';
                action = "/" + category + "/" + cpnyid + "/" + table + "/" + id;
            };

            if(target.matches('#delete-function-btn')){
                document.querySelectorAll('#delete-function').forEach(item => {
                    item.innerText = "「" + name + "」";
                });
                action = "/" + category + "/" + id + "/" + categoryid;
            };

            if(target.matches('#delete-question-btn')){
                document.querySelectorAll('#delete-question').forEach(item => {
                    item.innerText = "「" + name + "」";
                });

                action = "/" + category + "/" + id + "/" + functionid;

                if(categoryid){
                    action += "/" + categoryid;
                };
                
            };

            if(target.matches('#delete-question-admin-btn')){
                document.querySelectorAll('#delete-question').forEach(item => {
                    item.innerText = "「" + name + "」";
                })
                action =  "/" + category + "/" + id + "/" + functionid;
            };

            if(target.matches('#admin-delete-user-btn')){
                document.querySelector('#delete-position').innerText = "「" + name + "」";
                action =  "/" + category + "/" + name + "/" + id;
            };

            deleteForm.action = action + "?_method=DELETE";
        });
    };
};
