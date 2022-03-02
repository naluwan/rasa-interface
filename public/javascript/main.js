window.onload = function() {
    var func = document.querySelector("[data-func]");
    if(func){
        document.documentElement.setAttribute("class",func.getAttribute("data-func"));
    };
    deleteButton();
    saveButton();
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
        saveButton();
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
        XML.open("GET", url);
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

//save button
function saveButton(){
    var save = document.querySelector("#save");
    if(save){
        save.onclick = function(){            
            function back(info){
                var info = JSON.parse(info.data);
                var status = info.status;

                if(status != "success"){
                    status = "warning";
                };

                var html = "<h3 style='text-align:center;'><div class='sa-icon " + status + "'><span></span></div>" + info.message + "！</h3>";

                var prevPage = null;
                if(status == "success"){
                    prevPage= function(){
                        document.querySelector("#cancel").click();
                    };
                };

                showBox(html,"message","",prevPage)                
            };
            var id = document.querySelector("form").id;
            var cpnyid = this.getAttribute("data-cpnyid");
            var url = location.origin + "/johnnyHire/" + cpnyid + "/" + id + "/edit?entity_name=" + entity_name.value + "&des=" + encodeURI(des.value);
            asyncAjax(url,back,true);
        };
    };
};

//showBox
function showBox(INFO,ID,CLOSE,FUN){
    
    /*
    INFO =放入彈出視窗的 html
    ID = 彈出視窗的名字
    CLOSE = 不需要關閉按鈕才需指定參數為 "N"
    FUN = 當有關閉按鈕,關閉視窗後執行程式
    */
    
    var InpBox = document.createElement("div");
    InpBox.setAttribute("class","showBox");
    
    if(ID !== undefined){
        InpBox.setAttribute("id",ID);
    };
    
    document.body.style.overflow = "hidden";
    document.body.appendChild(InpBox);
    
    var InpBoxDiv1 = document.createElement("div");
    var InpBoxDiv2 = document.createElement("div");
    InpBoxDiv2.setAttribute("class","content");
    InpBoxDiv2.style.overflow = "auto";    
    InpBoxDiv2.innerHTML = INFO;
    
    InpBoxDiv1.appendChild(InpBoxDiv2);
    InpBox.appendChild(InpBoxDiv1);
    
    window.addEventListener("resize",RESIZE);

    function RESIZE(){
        var WH = document.documentElement.clientHeight;
        var MH2 = InpBoxDiv2;
        if(localStorage.getItem("ZOOM")==null){
            MH2.style.maxHeight = Math.floor(WH * .9 - 40) + "px";
        }else{
            MH2.style.maxHeight = Math.floor(WH * .9 - 40) / localStorage.getItem("ZOOM") + "px";
        };
    };

    RESIZE();

    /*區塊外點擊關閉視窗*/
    if(CLOSE == undefined || CLOSE !== "N"){
        showboxClose(InpBox,FUN);
    }else{
        InpBox.classList.add("noClose");
    };
    
};

//showBox close
function showboxClose(inputBox,fun){
    var boxBack = document.createElement("span");
    boxBack.setAttribute("style","width:100%;height:100%;display:block;position:fixed;top:0;left:0;");
    inputBox.appendChild(boxBack);

    //加入關閉視窗按鈕
    var CLOSE = document.createElement("span");
    CLOSE.setAttribute("class","close");
    inputBox.querySelector("div").appendChild(CLOSE);

    //X 關閉視窗
    CLOSE.onclick = function(){boxClose();};

    //內容外 關閉視窗
    boxBack.onclick = function(){boxClose();};

    //視窗彈出鍵盤 ESC 關閉視窗
    if(window.event){
        document.documentElement.onkeydown = function(event){
            if(window.event.keyCode == 27){boxClose();};
        };
    }else{
        document.documentElement.onkeydown = function(event){
            if(event.key == "Escape"){boxClose();};
        };
    };

    function boxClose(){
        inputBox.outerHTML="";
        if(!document.querySelector(".showBox")){
            document.body.style.overflow = "";
        };
        document.documentElement.onkeydown = "";
        
        if(fun){
            fun();
        };
    };
};
