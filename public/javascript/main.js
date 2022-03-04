window.onload = function() {
    var func = document.querySelector("[data-func]");
    if(func){
        document.documentElement.setAttribute("class",func.getAttribute("data-func"));
    };
    deleteButton();
    saveButton();
    addButton();
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
        addButton();
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
    if(document.querySelector("#del")){
        document.querySelector("#data-panel").onclick = function(event){

            if(event.target.getAttribute("id") != "del"){
                return;
            };

            var listName = event.target.parentNode.previousElementSibling.querySelector("[data-title]").title;

            var html = "<h3 style='text-align:center;'><div class='sa-icon warning'><span></span></div>確定刪除" + listName + "！</h3>";

            showBox(html,"message","");

            var msgBox = document.querySelector("#message .content");

            var footButton = document.createElement("div");
            footButton.setAttribute("class","button");
            msgBox.appendChild(footButton);

            var cencelButton = document.createElement("button");
            cencelButton.innerText = "取消";
            cencelButton.setAttribute("class","btn btn-primary");
            cencelButton.onclick = function() {
                document.querySelector("#message").remove();
            };
            footButton.appendChild(cencelButton);

            var delButton = document.createElement("button");
            delButton.innerText = "確定";
            delButton.setAttribute("class","btn btn-info");

            delButton.onclick = function() {
                document.querySelector("#message").remove();
                deleteList();
            };
            footButton.appendChild(delButton);
            
            function deleteList(){
                loading();                            
                var url = location.href + "/delete?infoId=" + event.target.getAttribute("data-infoId");
                console.log(url)

                function back(info){
                    var info = JSON.parse(info.data);
                    console.log(info)

                    var html = "<h3 style='text-align:center;'><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "！</h3>";

                    var prevPage = null;
                    if(info.status == "success"){
                        prevPage = function(){
                            event.target.parentNode.parentNode.remove();
                        };
                    };
                    loadingClose();
                    showBox(html,"message","",prevPage);
                };

                asyncAjax(url,back,true);
            };
        };
    };
};

//save button
function saveButton(){
    if(document.querySelector("#save")){
        save.onclick = function(event){
            var infoId = this.getAttribute("data-infoId");
            var data="?";
            var inputs = document.querySelectorAll("[required]");
            for(var i=0;i<inputs.length;i++){
                if(inputs[i].value==""){
                    return;
                };
                data += "&" + inputs[i].id + "=" + inputs[i].value;
            };

            data += "&infoId=" + infoId;
            
            loading();

            event.preventDefault();
                            
            var url = location.href + "/update" + encodeURI(data);
            console.log(url)

            function back(info){
                var info = JSON.parse(info.data);
                console.log(info)

                var html = "<h3 style='text-align:center;'><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "！</h3>";

                var prevPage = null;
                if(info.status == "success"){
                    prevPage = function(){
                        document.querySelector("#cancel").click();
                    };
                };
                loadingClose();
                showBox(html,"message","",prevPage);
            };

            asyncAjax(url,back,true);
        };
    };
};

//add button
function addButton(){
    if(document.querySelector("#add")){
        add.onclick = function(event){
            var data="?";
            var inputs = document.querySelectorAll("[required]");
            for(var i=0;i<inputs.length;i++){
                if(inputs[i].value==""){
                    return;
                };
                data += "&" + inputs[i].id + "=" + inputs[i].value;
            };
            
            loading();

            event.preventDefault();
                            
            var url = location.href + "/insert" + encodeURI(data);
            console.log(url)

            function back(info){
                var info = JSON.parse(info.data);
                console.log(info)

                var html = "<h3 style='text-align:center;'><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "！</h3>";

                var prevPage = null;
                if(info.status == "success"){
                    prevPage = function(){
                        document.querySelector("#cancel").click();
                    };
                };
                loadingClose();
                showBox(html,"message","",prevPage);
            };

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
