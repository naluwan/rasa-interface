window.onload = function() {
    var func = document.querySelector("[data-func]");
    
    if(func){
        document.documentElement.setAttribute("class",func.getAttribute("data-func"));
    };

    Method.button.all();
    Method.search.keyWord();
    Method.common.heightLight();
    Method.common.train();
    
};

window.onfocus = function() {
    Method.common.train();
};

window.onpopstate = function() {
    var history = location.pathname;
    console.log(history)
    Method.common.page(history,"history");
};

worker = new Worker("/javascript/worker.js");


Method={};

Method.button={};

//button action
Method.button.all = function(){
    Method.button.saveButton();
    Method.button.addButton();
    Method.button.delButton();
    Method.button.closeButton();
    Method.button.repwdButton();
    Method.button.forgetButton();
    Method.button.resetPwd();
};

//save button
Method.button.saveButton = function(){
    if(document.querySelector("#save")){
        save.onclick = function(event){

            var data = "";
            var symbol;

            var inputs = document.querySelectorAll("[required]");
            for(var i=0;i<inputs.length;i++){
                if(inputs[i].value==""){
                    return;
                };

                i == 0 ? symbol = "?" : symbol = "&";

                data += symbol + inputs[i].name + "=" + inputs[i].value;
            };

            var infoId = this.getAttribute("data-infoId");
            if(infoId != null){
                data += "&infoId=" + infoId;
            };
            
            Method.common.loading();

            event.preventDefault();
                            
            function back(info){

                var info = JSON.parse(info.data);
                console.log(info)

                var html = "<h2><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "</h2>";

                var prevPage = null;
                if(info.status == "success"){
                    prevPage = function(){
                        document.querySelector("#cancel").click();
                    };
                };

                Method.common.loadingClose();
                Method.common.showBox(html,"message","",prevPage);
            };

            var url = location.href + "/update" + encodeURI(data);
            console.log(url)

            Method.common.asyncAjax(url,back);
        };
    };
};

//add button
Method.button.addButton = function(){
    if(document.querySelector("#add")){
        add.onclick = function(event){
            var data="?";
            var inputs = document.querySelectorAll("[required]");
            for(var i=0;i<inputs.length;i++){
                if(inputs[i].value==""){
                    return;
                };
                data += "&" + inputs[i].name + "=" + inputs[i].value;
            };

            event.preventDefault();
            
            Method.common.loading();            
                            
            function back(info){
                var info = JSON.parse(info.data);
                console.log(info)
                
                var html = "<h2><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "</h2>";

                var prevPage = null;
                if(info.status == "success"){

                    if(document.querySelector("#cancel")){
                        prevPage = function(){
                            document.querySelector("#cancel").click();
                        };
                    }else{
                        prevPage = function(){
                            Method.common.page("/");
                        };
                    };
                };

                Method.common.loadingClose();
                Method.common.showBox(html,"message","",prevPage);
            };

            var url = location.href + "/insert" + encodeURI(data);
            console.log(url)

            Method.common.asyncAjax(url,back);
        };
    };
};

//del button
Method.button.delButton = function(){

    var delButton = document.querySelectorAll("#del");

    for(var i=0;i<delButton.length;i++){
        delButton[i].onclick = function(){
            run(this);
        };
    };

    function run(obj){

        var listName = obj.getAttribute("data-title");

        var html = "<h2><div class='sa-icon warning'><span></span></div>確定刪除 " + listName + "</h2>";

        Method.common.showBox(html,"message");

        var content = document.querySelector("#message .content");

        var footButton = document.createElement("div");
        footButton.setAttribute("class","button");
        content.appendChild(footButton);

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
            Method.common.loading();

            function back(info){
                var info = JSON.parse(info.data);
                console.log(info)

                var html = "<h2><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "</h2>";

                if(info.status == "success"){
                    obj.parentNode.parentNode.remove();
                };
                Method.common.loadingClose();
                Method.common.showBox(html,"message");
            };

            var data = "";

            if(obj.getAttribute("data-category")){
                data += "&category=" + obj.getAttribute("data-category");
            };
            
            var url = location.href + "/delete?infoId=" + obj.getAttribute("data-infoId") + data;
            
            console.log(url)

            Method.common.asyncAjax(url,back);
        };
    };
};

//close button
Method.button.closeButton = function(){
    if(document.querySelector("button.close")){
        document.querySelector("button.close").onclick = function(){
            this.parentNode.remove();
        };
    };
};

//repwd button
Method.button.repwdButton = function(){

    var repwdButton = document.querySelectorAll("#repwd");

    for(var i=0;i<repwdButton.length;i++){
        repwdButton[i].onclick = function(){
            run(this);
        };
    };

    function run(obj){

        var listName = obj.getAttribute("data-title");

        Method.common.showBox("","message");

        var content = document.querySelector("#message .content");

        var h1 = document.createElement("h1");
        h1.innerText = "修改密碼";
        content.appendChild(h1);

        var rePassword = document.createElement("form");
        rePassword.setAttribute("action","");
        rePassword.setAttribute("name","form");
        rePassword.setAttribute("id","rePassword");
        content.appendChild(rePassword);

        var password = document.createElement("input");
        password.setAttribute("type","password");
        password.setAttribute("name","password");
        password.setAttribute("class","form-control");
        password.setAttribute("placeholder","請輸入新密碼");
        password.setAttribute("required","");
        rePassword.appendChild(password);

        var confirmPassword = document.createElement("input");
        confirmPassword.setAttribute("type","password");
        confirmPassword.setAttribute("name","confirmPassword");
        confirmPassword.setAttribute("class","form-control");
        confirmPassword.setAttribute("placeholder","請再次輸入密碼");
        confirmPassword.setAttribute("required","");
        rePassword.appendChild(confirmPassword);

        var footButton = document.createElement("div");
        footButton.setAttribute("class","button");
        rePassword.appendChild(footButton);

        var cencelButton = document.createElement("button");
        cencelButton.innerText = "取消";
        cencelButton.setAttribute("class","btn btn-primary");
        cencelButton.onclick = function() {
            document.querySelector("#message").remove();
        };
        footButton.appendChild(cencelButton);

        var saveButton = document.createElement("button");
        saveButton.innerText = "確定";
        saveButton.type = "submit";
        saveButton.setAttribute("class","btn btn-info");

        saveButton.onclick = function(event) {

            function back(info){
                var info = JSON.parse(info.data);
                console.log(info)

                var html = "<h2><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "</h2>";

                if(info.status == "success"){
                    document.querySelector("#message .content").innerHTML = html;
                }else{
                    Method.common.showBox(html,"message","");
                };
                Method.common.loadingClose();
            };

            var data="/repwd?infoId=" + listName;
            var inputs = document.querySelectorAll("#message [required]");
            console.log(inputs)
            for(var i=0;i<inputs.length;i++){
                
                if(inputs[i].value==""){
                    return;
                };

                data += "&" + inputs[i].name + "=" + inputs[i].value;
            };

            event.preventDefault();

            Method.common.loading();

            var url = location.href + data;
            console.log(url)

            Method.common.asyncAjax(url,back);
        };

        footButton.appendChild(saveButton);
        
    };
};

//forget button
Method.button.forgetButton  = function(){

    if(document.querySelector("#forget")){

        document.querySelector("#forget").onclick = function(){

            var html = 
                '<h1>忘記密碼</h1>'+
                '<form action="" name="forgetForm">'+
                    '<input type="email" class="form-control" name="email" placeholder="請輸入申請帳號時所填入的E-mail">'+
                    '<div>'+
                        '<button id="sendEmail" type="button" class="btn btn-info">送出</button>'+
                    '</div>'+
                '</form>';

            Method.common.showBox(html,"forgetBox");

            document.querySelector("#sendEmail").onclick = function(event) {
                
                function back(info){
                    var info = JSON.parse(info.data);
                    console.log(info)
    
                    var html = "<h5><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "</h5>";
    
                    document.querySelector("#forgetBox .content").innerHTML = html;
    
                    Method.common.loadingClose();
                };

                if(forgetForm.email.value == ""){
                    forgetForm.email.focus();
                };

                event.preventDefault();

                Method.common.loading();

                var url = location.origin + "/users/sendResetMail?email=" + forgetForm.email.value;
                console.log(url)
                Method.common.asyncAjax(url,back);
            }
        };
    };
};

//resetPassword button
Method.button.resetPwd = function(){
    if(document.querySelector("#resetPwd")){
        resetPwd.onclick = function(event){

            function back(info){
                var info = JSON.parse(info.data);
                console.log(info)

                var html = "<h2><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "</h2>";

                function goLogin(){
                    Method.common.page("/")
                };

                Method.common.showBox(html,"message","",goLogin);

                Method.common.loadingClose();
            };

            var data = "/update";
            var inputs = document.querySelectorAll("[required]");
            for(var i=0;i<inputs.length;i++){
                if(inputs[i].value==""){
                    return;
                };

                i == 0 ? symbol = "?" : symbol = "&";

                data += symbol + inputs[i].name + "=" + inputs[i].value;
            };

            event.preventDefault();

            var url = location.href + data;
            console.log(url)
            Method.common.asyncAjax(url,back);
        };
    };
};


//search
Method.search={};

Method.search.keyWord = function(){

    if(!document.querySelector("#search")){
        return;
    };

    if(document.querySelector("form select[required]")){

        //admin_search
        //cs_function
        //cs_question
        //cs_new_question"

        if(document.querySelector("#categorySelect")){
            categorySelect.onchange = function(){
                Method.search.question();
            };
        };
        
        document.querySelector("[type='submit']").onclick = function(event){

            var data = "";

            var required = document.querySelectorAll("form [required]");

            for(var i=0;i<required.length;i++){
                //必填未填中止
                if(required[i].value == ""){
                    return;
                };
            };


            var inputs = document.querySelectorAll("form [name]");
            var symbol;
            for(var i=0;i<inputs.length;i++){
                i == 0 ? symbol = "?" : symbol = "&";
                data += symbol + inputs[i].name + "=" + inputs[i].value;
            };

            event.preventDefault();

            var url = "";

            if(document.querySelector(".admin_search")){
                url += "/admin_search/filter";
            };
            
            if(document.querySelector(".cs_function")){
                url += "/cs_function/filter";
            };

            if(document.querySelector(".cs_question")){
                url += "/cs_question/filter";
            };

            url += data;

            console.log(url)
            
            Method.common.page(url,"search");

        };

    }else{

        search.onkeyup = function(){

            if(search.value == ""){
                searchCss.innerHTML="";
                document.querySelector("#data-panel").removeAttribute("class");
                return;
            };

            if(document.querySelector("#msg")){
                msg.remove();
            };

            var code =  "{}[]',:?/><=+-()!@#$%^&*`~|\\" + '"';
            var x = [].slice.call(code);
            var y = [].slice.call(search.value);

            for(var i=0;i<y.length;i++){
                if(x.includes(y[i])){
                    search.value = search.value.replace(y[i],"");
                    var html = "<h2><div class='sa-icon warning'><span></span></div>請輸入文字</h2>";
                    Method.common.showBox(html,"message");
                    return;
                };
            };

            searchCss.innerHTML = "#data-panel > :not([data-search*='" + search.value + "']){display:none;}";

            if(document.querySelector("#data-panel").clientHeight == 50){
                document.querySelector("#data-panel").setAttribute("class","noList");
            }else{
                document.querySelector("#data-panel").removeAttribute("class");
            };
        };
    };
};

Method.search.question = function(){

    function back(info){

        var info = JSON.parse(info.data);

        console.log("info",info);

        if(info.status != "success"){
            var html = "<h2><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "</h2>";
            Method.common.showBox(html,"message");
            return;
        };

        functionSelect.innerHTML = "";

        for(var i=0;i<info.data.length;i++){
            var option = document.createElement("option");
            option.value = info.data[i].FUNCTION_ID;
            option.innerText = info.data[i].FUNCTION_NAME;
            functionSelect.appendChild(option);
        };

    };

    var url = location.origin + "/cs_question/getData?category_id=" + categorySelect.value;
    Method.common.asyncAjax(url,back);

};


Method.common={}

//loading
Method.common.loading = function(){
    
    var InpBox = document.createElement("div");
    InpBox.setAttribute("id","loading");
    
    var loading = document.createElement("img");
    loading.src = "/images/loading.svg";

    InpBox.appendChild(loading);

    document.body.appendChild(InpBox);
    
};

Method.common.loadingClose = function(){
    document.querySelector("#loading") && document.querySelector("#loading").remove();
};

//showBox
Method.common.showBox = function(INFO,ID,CLOSE,FUN){
    
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
        Method.common.showboxClose(InpBox,FUN);
    }else{
        InpBox.classList.add("noClose");
    };
    
};

//showBox close
Method.common.showboxClose = function(inputBox,fun){
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

//jump page
Method.common.page = function(url,type){

    Method.common.loading();
    
    function back(info){

        var parse = new DOMParser();
        var html = parse.parseFromString(info.data,"text/html");

        //異常
        if(html.querySelector("pre")){
            Method.common.loadingClose();
            var info = JSON.parse(html.querySelector("pre").innerHTML);
            var html = "<h2><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "</h2>";

            function cancel(){
                if(document.querySelector("#cancel")){
                    document.querySelector("#cancel").click();
                };
            };

            Method.common.showBox(html,"message","",cancel);
            return;
        };

        //登入
        if(document.querySelector(".login")){

            if(!html.querySelector(".container")){
                history.go(0);
                Method.common.loadingClose();
                return;
            };

            document.querySelector(".container").innerHTML = html.querySelector(".container").innerHTML;
            Method.common.loadingClose();
        };

        //內頁
        if(document.querySelector(".index")){
            
            if(!html.querySelector(".setting")){
                history.go(0);
                Method.common.loadingClose();
                return;
            };            

            if(type == "search"){
                document.querySelector("#data-panel").innerHTML = html.querySelector("#data-panel").innerHTML;
                Method.common.loadingClose();
            }else{

                if(type != "history"){
                    //不是搜尋列 加入瀏覽紀錄
                    history.pushState("","",url);
                };
                
                document.querySelector(".setting").innerHTML = html.querySelector(".setting").innerHTML;

                //
                if(document.querySelector("#categorySelect")){
                    Method.search.question();
                };

                Method.search.keyWord();
                Method.common.loadingClose();
            };

            Method.button.all();
            Method.common.heightLight();
        };

    };
    
    Method.common.asyncAjax(location.origin + url,back);
};

//async ajax
Method.common.asyncAjax = function(url,back){
    //url 路徑
    //back is call back function

    if(!back){
        console.log("missing back function!");
        return;
    };
    
    worker.postMessage(["asyncAjax",url]);
    worker.onmessage = function(e){
        back(e);
    };
};

//主類別高亮
Method.common.heightLight = function(){
    if(document.querySelector(".des")){
        var des = document.querySelectorAll(".des");
        var enName = document.querySelectorAll(".enName")
        for(var i=0;i<des.length;i++){
            if(des[i].getAttribute("title").match("主類別") || !enName[i].getAttribute("title").match("_")){
                des[i].parentNode.parentNode.parentNode.classList.add("highlight");
            };
        };
    };
};

//訓練過渡
Method.common.train = function(){

    var train = document.querySelector("#train");

    if(train){

        function back(data){
            if(data.data != "0"){
                train.setAttribute("disabled","");
            }else{
                train.removeAttribute("disabled");
                return;
            };
    
            setTimeout(function(){
                Method.common.train();
            },5000)
        };
        
        Method.common.asyncAjax("/train/jh/status",back);

    };
    
};