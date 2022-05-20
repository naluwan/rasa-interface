window.onload = function() {
    var func = document.querySelector("[data-func]");
    
    if(func){
        document.documentElement.setAttribute("class",func.getAttribute("data-func"));
    };

    Method.button.all();
    Method.search.keyWord();
    Method.common.heightLight();
    Method.common.train();
    Method.common.multiIntent();
    Method.common.getStoryTitle();

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
    Method.button.backToTopBtn();
    Method.button.storyButton();
    Method.button.editStoryTitle();
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

// js_conversations & jh_story backTopBtn
Method.button.backToTopBtn = function(){
    if(document.querySelector('.jh_conversations') || document.querySelector('.jh_story')){
        const footButton = document.querySelector('.footButton');
        window.onscroll = function(){
            const px = 300;
            if(document.body.scrollTop > px || document.documentElement.scrollTop > px){
                if(!document.querySelector('#backTopBtn')){
                    const backTopBtn = document.createElement('button');
                    backTopBtn.setAttribute('class', 'btn btn-light');
                    backTopBtn.setAttribute('id', 'backTopBtn');
                    const btnIcon = document.createElement('i');
                    btnIcon.setAttribute('class', 'fas fa-chevron-circle-up fa-2x');
                    backTopBtn.appendChild(btnIcon);
                    footButton.appendChild(backTopBtn);

                    backTopBtn.onclick = function(){
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        })
                    }
                }
            }else{
                if(document.querySelector('#backTopBtn')){
                    document.querySelector('#backTopBtn').remove();
                }
            }
        }
    }
}

// jh_new_story 互動按鈕
Method.button.storyButton = function(){
    if(document.querySelector('.jh_new_story')){
        const stories = document.querySelector('#stories');

        // 使用者按鈕事件
        if(document.querySelector('#userBtn')){
            userBtn.onclick = function(){
                clickUserBtn();
            }
        }
        
        // 機器人按鈕事件
        if(document.querySelector('#botBtn')){
            botBtn.onclick = function(){
                clickBotBtn();
            }
        }

        // 新增故事流程區塊滑鼠移動事件
        stories.addEventListener('mousemove', e => {
            btnDiv.style.opacity = '1';
            btnDiv.style.transition = 'opacity .1s ease-in-out';
            if(document.querySelectorAll('#storyDiv')){
                const allStoryDiv = document.querySelectorAll('#storyDiv');
                const allTopRightDiv = document.querySelectorAll('.top-right');
                const allBottomRightDiv = document.querySelectorAll('.bottom-right');
                const allResNameInput = document.querySelectorAll('#res-name-input');
                const allIntentBtn = document.querySelectorAll('#intentBtn')

                // 顯示刪除按鈕和故事流程外框
                // 每一個storyDiv都會有一個topRightDiv
                // 但不是每一個storyDiv都會有bottomRightDiv，所以要分開寫
                for(i = 0; i < allStoryDiv.length; i++){
                    allTopRightDiv[i].style.visibility = 'visible';
                    allStoryDiv[i].style.border = '1px solid #ccc';
                }

                // 動態顯示意圖按鈕
                for(i = 0; i < allIntentBtn.length; i++){
                    const storySpanArray = allIntentBtn[i].parentElement.parentElement.previousElementSibling.childNodes
                    const hasIntent = []
                    for(j = 0; j < storySpanArray.length; j++){
                        if(storySpanArray[j].id == 'intent-span'){
                            hasIntent.push(storySpanArray[j].id)
                        }
                    }
                    if(hasIntent.length){
                        allIntentBtn[i].style.visibility = 'hidden'
                    }else{
                        allIntentBtn[i].style.visibility = 'visible'
                    }
                }

                // 動態顯示機器人對話名稱
                if(allBottomRightDiv.length){
                    for(i = 0; i < allBottomRightDiv.length; i++){
                        allBottomRightDiv[i].style.visibility = 'visible';
                        allBottomRightDiv[i].setAttribute('data-ismouseleave', 'false');
                    }
                }
            }

            
            // 動態顯示使用者按鈕
            if(stories.lastElementChild.previousSibling.className == 'userStep'){
                if(document.querySelector('#userBtn')){
                    userBtn.style.display = 'none';
                    botBtn.style.marginLeft = '0';
                }
            }else{
                    userBtn.style.display = 'inline-block';
                    botBtn.style.marginLeft = '12px';
            }
        })

        // 動態隱藏
        stories.addEventListener('mouseleave', e => {
            if(document.querySelector('#btnDiv')){
                btnDiv.style.opacity = '0';
                btnDiv.style.transition = 'opacity .1s ease-in-out';
            }

            if(document.querySelectorAll('#storyDiv')){
                const allStoryDiv = document.querySelectorAll('#storyDiv');
                const allTopRightDiv = document.querySelectorAll('.top-right');
                const allBottomRightDiv = document.querySelectorAll('.bottom-right');
                const allResNameInput = document.querySelectorAll('#res-name-input');
                const allIntentBtn = document.querySelectorAll('#intentBtn')

                // 隱藏刪除按鈕和故事流程外框
                for(i = 0; i < allStoryDiv.length; i++){
                    allTopRightDiv[i].style.visibility = 'hidden';
                    allStoryDiv[i].style.border = '1px solid transparent';
                }

                // 隱藏意圖按鈕
                for(i = 0; i < allIntentBtn.length; i++){
                    allIntentBtn[i].style.visibility = 'hidden'
                }


                // 隱藏機器人對話名稱
                if(allBottomRightDiv.length){
                    for(i = 0; i < allBottomRightDiv.length; i++){
                        allBottomRightDiv[i].setAttribute('data-ismouseleave', 'true');
                        if(allBottomRightDiv[i].dataset.isfocus == 'false'){
                            allBottomRightDiv[i].style.visibility = 'hidden';
                        }
                    }
                }
            }
        })   
    }

    // 點擊使用者按鈕
    function clickUserBtn(){
        const stories = document.querySelector('#stories');
        const storyDiv = document.createElement('div');
        storyDiv.setAttribute('id', 'storyDiv');
        storyDiv.setAttribute('class', 'userStep');
        storyDiv.setAttribute('style', 'border: 1px solid transparent;border-radius: 5px')

        const storySpan = document.createElement('span');
        storySpan.setAttribute('id', 'storySpan');

        const input = document.createElement('input');
        input.setAttribute('placeholder', '使用者說....');
        input.setAttribute('name', 'userInput');
        input.setAttribute('id', 'userInput');
        input.setAttribute('class', 'form-control story-user');
        input.setAttribute('data-event', 'blur')
        input.setAttribute('data-status', 'waiting')

        const removeBtn = document.createElement('button');
        removeBtn.setAttribute('type', 'button');
        removeBtn.setAttribute('id', 'removeBtn');
        removeBtn.setAttribute('class', 'btn btn-danger');
        removeBtn.setAttribute('style', 'margin-left: 5px;');

        const removeIcon = document.createElement('i');
        removeIcon.setAttribute('class', 'fas fa-trash-alt');
        removeIcon.setAttribute('style', 'font-size: 7px;');
        removeBtn.appendChild(removeIcon);

        const intentBtn = document.createElement('button');
        intentBtn.setAttribute('type', 'button');
        intentBtn.setAttribute('id', 'intentBtn');
        intentBtn.setAttribute('class', 'btn btn-warning');

        const intentIcon = document.createElement('i');
        intentIcon.setAttribute('class', 'fas fa-tag');
        intentIcon.setAttribute('style', 'font-size: 7px;');
        intentBtn.appendChild(intentIcon);

        // 移除按鈕加上點擊事件
        removeBtn.onclick = function(e){
            // storyName - 該頁面故事流程名稱
            const target = e.target;
            const storyName = document.querySelector('#storyTitle').innerText

            // userStoryDiv - 該點擊目標的故事流程步驟外框，用來刪除故事流程步驟用
            // text - 該點擊目標故事流程步驟，使用者輸入的文字
            // intent - 該點擊目標故事流程步驟，使用者的意圖，使用slice()是因為顯示文字時，在前方加上「意圖: 」，所以取意圖需要去除前4個字
            if(target.matches('#removeBtn')){
                const userStoryDiv = target.parentElement.parentElement.parentElement
                if(target.parentElement.parentElement.previousElementSibling.childNodes[0].id == 'userInput'){
                    if(target.parentElement.parentElement.previousElementSibling.childNodes[0].value){
                        const text = target.parentElement.parentElement.previousElementSibling.childNodes[0].value
                        let intent = target.parentElement.parentElement.previousElementSibling.childNodes[1].childNodes[2].innerText
                        intent = intent.slice(4, intent.length)
                        removeUserStep(storyName, text, intent, userStoryDiv)
                    }else{
                        userStoryDiv.remove()
                    }
                }else{
                    const text = ''
                    let intent = target.parentElement.parentElement.previousElementSibling.childNodes[0].childNodes[2].innerText
                    intent = intent.slice(4, intent.length)
                    removeUserStep(storyName, text, intent, userStoryDiv)
                }
            }

            if(target.tagName == 'svg'){
                const userStoryDiv = target.parentElement.parentElement.parentElement.parentElement
                if(target.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0].id == 'userInput'){
                    if(target.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0].value){
                        const text = target.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0].value
                        let intent = target.parentElement.parentElement.parentElement.previousElementSibling.childNodes[1].childNodes[2].innerText
                        intent = intent.slice(4, intent.length)
                        removeUserStep(storyName, text, intent, userStoryDiv)
                    }else{
                        userStoryDiv.remove()
                    }
                }else{
                    const text = ''
                    let intent = target.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0].childNodes[2].innerText
                    intent = intent.slice(4, intent.length)
                    removeUserStep(storyName, text, intent, userStoryDiv)
                }
            }

            if(target.tagName == 'path'){
                const userStoryDiv = target.parentElement.parentElement.parentElement.parentElement.parentElement
                if(target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0].id == 'userInput'){
                    if(target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0].value){
                        const text = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0].value
                        let intent = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.childNodes[1].childNodes[2].innerText
                        intent = intent.slice(4, intent.length)
                        removeUserStep(storyName, text, intent, userStoryDiv)
                    }else{
                        userStoryDiv.remove()
                    }
                }else{
                    const text = ''
                    let intent = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0].childNodes[2].innerText
                    intent = intent.slice(4, intent.length)
                    removeUserStep(storyName, text, intent, userStoryDiv)
                }
            }

            // 移除故事流程function
            function removeUserStep(storyName, userSays, intent, userStoryDiv){
                fetch(`http://localhost:3030/jh_story/userStep/remove?storyName=${storyName}&userSays=${userSays}&intent=${intent}`)
                .then(response => response.json())
                .then(info => {
                    if(info.status == 'success'){
                        userStoryDiv.remove()
                    }
                })
                .catch(err => console.log(err))
            }
        }

        const btnSpan = document.createElement('span');
        btnSpan.appendChild(intentBtn);
        btnSpan.appendChild(removeBtn);

        const topRightDiv = document.createElement('div');
        topRightDiv.setAttribute('class', 'top-right');
        topRightDiv.setAttribute('style', 'max-width: 100px;position: absolute;top: 9px;right: 9px;visibility: hidden;');
        topRightDiv.appendChild(btnSpan);

        storySpan.appendChild(input);
        storyDiv.appendChild(storySpan);
        storyDiv.appendChild(topRightDiv);
        stories.insertBefore(storyDiv, stories.lastElementChild);

        // 點擊意圖按鈕事件
        intentBtn.addEventListener('click', e => {
            const target = e.target;

            if(target.matches('#intentBtn')){
                const storyContainer = target.parentElement.parentElement.previousElementSibling
                const targetInput = target.parentElement.parentElement.previousElementSibling.childNodes[0]
                clickIntentBtn(storyContainer, targetInput);
            }

            if(target.tagName == 'svg'){
                const storyContainer = target.parentElement.parentElement.parentElement.previousElementSibling
                const targetInput = target.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0]
                clickIntentBtn(storyContainer, targetInput);
            }

            if(target.tagName == 'path'){
                const storyContainer = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling
                const targetInput = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0]
                clickIntentBtn(storyContainer, targetInput);
            }
        })

        // storySpan點擊事件
        // 由於userInput變成disabled之後，點擊事件無法運作，所以將點擊事件加在storySpan上
        storySpan.addEventListener('click', e => {
            const target = e.target

            // 顯示使用者新增例句彈跳窗
            if(target.matches('#userInput') && target.getAttribute('disabled') == ''){
                
                const userText = target.value.trim()
                const intent = target.nextElementSibling.innerText.slice(4, target.nextElementSibling.innerText.length)
                getTextExam(userText, intent)
            }

            // 使用者新增例句彈跳窗彈跳窗產生function
            function getTextExam(userText, intent){
                // 串接API - 抓取彈跳窗內所需資料
                fetch(`http://localhost:3030/jh_story/userStep/nlu/getTextExams?text=${userText}&intent=${intent}`)
                .then(response => response.json())
                .then(data => {
                    console.log(data)

                    // 彈跳窗標題產生關鍵字
                    let examsTitleHtml = ''
                    data.forEach(item => {
                        if(item.text == userText && item.intent == intent){
                            if(item.entities.length){
                                examsTitleHtml = createTextHtml(item, userText)
                            }
                        }
                    })


                    let html = `
                    <div class="userBoxTitle">
                        <span class="userTextTitle">${examsTitleHtml.text}</span>
                        <span id="intent-span" class="nluSpan"><i class="fas fa-tag" style="font-size: 7px;"></i><span id="intent-text" class="nluText">${intent}</span></span>
                    </div>
                    <form action="" name="userTextExam" style="width:800px;">
                        <input type="text" class="form-control" name="userExamInput" id="userExamInput" placeholder="使用者說...">
                        <div id="textExams-panel">
                    `

                    html = createTextsFunc(data, html, examsTitleHtml)

                    // 產生使用者例句 function
                    function createTextsFunc(data, html, examsTitleHtml){
                        data.forEach(item => {
                            // 產生例句html function
                            const examsTextHtml = createTextHtml(item, item.text, examsTitleHtml.titleInfo)
                            html += `
                            <div class="textExams--examples">
                                <span>
                                    <span id="intent-span" class="nluSpan">
                                        <i class="fas fa-tag" style="font-size: 7px;"></i>
                                        <span id="intent-text" class="nluText">${item.intent}</span>
                                    </span>
                                </span>
                                <span class="textExams-span">
                                    ${examsTextHtml.text}
                                </span>
                                <span>
                                    <span class="textExams--actionBtn">
                                        <span class="textExams--actionBtn_group">
                                            <button type="button" id="textExams--actionBtn_editBtn"><i class="fas fa-edit"></i></button>
                                            <button type="button" id="textExams--actionBtn_trashBtn"><i class="fas fa-trash-alt"></i></button>
                                        </span>
                                        <button type="button" id="textExams--actionBtn_starBtn"><i class="far fa-star"></i></button>
                                    </span>
                                </span>
                            </div>
                            `
                        })
                        return html
                    }

                    html += `
                    </div>
                    <div class="textExams--footer">
                        <button id="sendExam" type="button" class="btn btn-info">送出</button>
                    </div>
                </form>
                `

                    Method.common.showBox(html,"userTextBox");

                    eventFunc()

                    // 例句操作按鈕事件function
                    function eventFunc(){
                        // 彈跳窗例句滑鼠事件
                        const allTextExams = document.querySelectorAll('.textExams--examples')
                        allTextExams.forEach(element => {
                            // 顯示操作按鈕
                            element.addEventListener('mouseenter', e => {
                                const target = e.target
                                target.children[2].children[0].setAttribute('style', 'visibility:visible')
                            })

                            // 隱藏操作按鈕
                            element.addEventListener('mouseleave', e => {
                                const target = e.target
                                target.children[2].children[0].setAttribute('style', 'visibility:hidden')
                                if(target.lastElementChild.lastElementChild.lastElementChild.children[0].classList.value.includes('fa fa-star') && 
                                target.lastElementChild.lastElementChild.lastElementChild.children[0].dataset.prefix == 'fas'){
                                    target.lastElementChild.lastElementChild.lastElementChild.setAttribute('style', 'visibility:visible')
                                }
                            })
                        })

                        // 彈跳窗點擊事件
                        const userTextBox = document.querySelector('#userTextBox')
                        userTextBox.addEventListener('click', e => {
                            const target = e.target

                            // 隱藏關鍵字資訊彈跳窗
                            const allEntityBox = document.querySelectorAll('.examples-entity-box')
                            allEntityBox.forEach(entityBox => {
                                if(entityBox.dataset.status == 'show' && !target.matches('.entity-info') && target.tagName != 'svg' && target.tagName != 'path'){
                                    entityBox.setAttribute('style', 'display: none;')
                                    entityBox.setAttribute('data-status', 'hidden')
                                }
                            })

                            // 顯示關鍵字資訊彈跳窗
                            if(target.matches('#examples-entity-text')){
                                const entityBox = target.parentElement.previousElementSibling
                                entityBox.setAttribute('style', 'display: inline-block;position: absolute;top: 100%;left: 0;right: auto;background-color: #ccc;z-index:9999;')
                                entityBox.setAttribute('data-status', 'show')
                            }

                            // 顯示關鍵字資訊彈跳窗
                            if(target.matches('#examples-entity-value')){
                                const entityBox = target.parentElement.parentElement.previousElementSibling
                                entityBox.setAttribute('style', 'display: inline-block;position: absolute;top: 100%;left: 0;right: auto;background-color: #ccc;z-index:9999;')
                                entityBox.setAttribute('data-status', 'show')
                            }
                        })

                        // 彈跳窗典範按鈕點擊事件
                        const starBtns = document.querySelectorAll('#textExams--actionBtn_starBtn')
                        starBtns.forEach(startBtn => {
                            startBtn.addEventListener('click', e => {
                                const target = e.target
                                if(target.matches('#textExams--actionBtn_starBtn')){
                                    // 判斷是否增加典範
                                    clickStarBtn(target.children[0], target, starBtns)
                                }

                                if(target.tagName == 'svg'){
                                    clickStarBtn(target, target.parentElement, starBtns)
                                }

                                if(target.tagName == 'path'){
                                    clickStarBtn(target.parentElement, target.parentElement.parentElement, starBtns)
                                }

                                // 判斷是否增加典範function
                                function clickStarBtn(targetIcon, target, starBtns){
                                    if(targetIcon.classList.value.includes('fa fa-star') && targetIcon.dataset.prefix == 'far'){
                                        // 如果已經有典範的處理方式
                                        starBtns.forEach(item => {
                                            if(item.children[0].classList.value.includes('fa fa-star') && item.children[0].dataset.prefix == 'fas'){
                                                item.innerHTML = `<i class="far fa-star"></i>`
                                                item.previousElementSibling.setAttribute('style', 'display:inline-block')
                                                item.removeAttribute('style')
                                            }
                                        })
                                        target.innerHTML = `<i class="fas fa-star"></i>`
                                        target.previousElementSibling.setAttribute('style', 'display:none')
                                    }else{
                                        target.innerHTML = `<i class="far fa-star"></i>`
                                        target.previousElementSibling.setAttribute('style', 'display:inline-block')
                                        target.removeAttribute('style')
                                    }
                                }
                            })
                        })

                        // 彈跳窗編輯按鈕點擊事件
                        const editBtns = document.querySelectorAll('#textExams--actionBtn_editBtn')
                        editBtns.forEach(editBtn => {
                            // 編輯按鈕點擊事件
                            editBtn.addEventListener('click', e => {
                                const target = e.target

                                if(target.matches('#textExams--actionBtn_editBtn')){
                                    const targetElement = target.parentElement.parentElement.parentElement.previousElementSibling
                                    clickEditBtn(targetElement)
                                }

                                if(target.tagName == 'svg'){
                                    const targetElement = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling
                                    clickEditBtn(targetElement)
                                }

                                if(target.tagName == 'path'){
                                    const targetElement = target.parentElement.parentElement.parentElement.parentElement.parentElement.previousElementSibling
                                    clickEditBtn(targetElement)
                                }

                                // 點擊編輯按鈕function
                                function clickEditBtn(targetElement){
                                    let entityText = targetElement.innerText
                                    entityText = sliceText(entityText)
                                    targetElement.innerHTML = `
                                        <input type="text" value="${entityText}" name="editEntityText" id="editEntityText" style="width: 100%;">
                                    `

                                    document.querySelector('#editEntityText').addEventListener('blur', e => {
                                        const target = e.target
                                        let arrayNum
                                        if(target.value == entityText) return
                                        for(i = 0; i < data.length; i++){
                                            if(data[i].text == entityText){
                                                arrayNum = i
                                            }
                                        }
                                        fetch(`http://localhost:3030/jh_story/parse?userInput=${target.value}`)
                                        .then(response => response.json())
                                        .then(textParse => {
                                            const newExamText = {
                                                text: textParse.text,
                                                intent: textParse.intent.name,
                                                entities: textParse.entities,
                                                metadata: {
                                                    language: 'zh'
                                                }
                                            }
                                            data.splice(arrayNum, 1, newExamText)
                                            return data
                                        })
                                        .then(newData => {
                                            let newExamHtml = ''
                                            newExamHtml = createTextsFunc(newData, newExamHtml, examsTitleHtml)
                                            document.querySelector('#textExams-panel').innerHTML = newExamHtml
                                            eventFunc()
                                        })
                                        .catch(err => console.log(err))
                                    })
                                    // 擷取例句字串function
                                    function sliceText(entityText){
                                        entityText = entityText.replace(/\n/g, '')
                                        while(entityText.indexOf(' ≪') > -1){
                                            const startNum = entityText.indexOf(' ≪')
                                            const endNum = entityText.indexOf('≫')
                                            const entityValueText = entityText.slice(startNum, endNum + 1)
                                            entityText = entityText.replace(entityValueText, '')
                                        }
                                        return entityText
                                    }
                                }
                            })
                        })
                    }
                    

                    // 彈跳窗title滑鼠事件 - 顯示關鍵字代號
                    const allEntityLabels = document.querySelectorAll('.entity-label')
                    allEntityLabels.forEach(entityLabel => {
                        entityLabel.addEventListener('mouseenter', e => {
                            const target = e.target
                            target.children[0].setAttribute('style', 'position: absolute;bottom: -90%; left:0;background-color: #fff;')
                        })

                        entityLabel.addEventListener('mouseleave', e => {
                            const target = e.target
                            target.children[0].setAttribute('style', 'display: none;')
                        })
                    })

                    // 彈跳窗使用者添加例句功能
                    const userExamInput = document.querySelector('#userExamInput')
                    // 彈跳窗例句輸入框焦點事件
                    userExamInput.addEventListener('focus', e => {
                        const target = e.target
                        target.setAttribute('data-event', 'blur')
                    })

                    // 彈跳窗例句輸入框失焦事件
                    userExamInput.addEventListener('blur', e => {
                        const target = e.target
                        const examText = target.value
                        if(target.dataset.event != 'blur' || !examText) return
                        // 串接後端API - 將使用者輸入的字句判斷意圖及關鍵字
                        fetch(`http://localhost:3030/jh_story/parse?userInput=${examText}`)
                        .then(response => response.json())
                        .then(inputParse => {
                            // 將回傳的判斷組成新的例句object
                            const newExam = {
                                text: inputParse.text,
                                intent: inputParse.intent.name,
                                entities: inputParse.entities,
                                metadata: {
                                    language: 'zh'
                                }
                            }
                            // 驗證是否重複
                            const repeatExam = data.filter(item => item.text == newExam.text)
                            if(!repeatExam.length){
                                data.push(newExam)
                                let newExamHtml = ''
                                newExamHtml = createTextsFunc(data, newExamHtml, examsTitleHtml)
                                document.querySelector('#textExams-panel').innerHTML = newExamHtml
                                eventFunc()
                                userExamInput.value = ''
                            }
                        })
                        .catch(err => console.log(err))
                    })

                    // 彈跳窗例句輸入框按鍵事件
                    userExamInput.addEventListener('keydown', e => {
                        const target = e.target
                        const examText = target.value
                        if(e.keyCode == 13){
                            if(!examText) return
                            target.setAttribute('data-event', 'keydown')
                            // 串接後端API - 將使用者輸入的字句判斷意圖及關鍵字
                            fetch(`http://localhost:3030/jh_story/parse?userInput=${examText}`)
                            .then(response => response.json())
                            .then(inputParse => {
                                // 將回傳的判斷組成新的例句object
                                const newExam = {
                                    text: inputParse.text,
                                    intent: inputParse.intent.name,
                                    entities: inputParse.entities,
                                    metadata: {
                                        language: 'zh'
                                    }
                                }
                                // 驗證是否重複
                                const repeatExam = data.filter(item => item.text == newExam.text)
                                if(!repeatExam.length){
                                    data.push(newExam)
                                    let newExamHtml = ''
                                    newExamHtml = createTextsFunc(data, newExamHtml, examsTitleHtml)
                                    document.querySelector('#textExams-panel').innerHTML = newExamHtml
                                    eventFunc()
                                    userExamInput.value = ''
                                }
                            })
                            .catch(err => console.log(err))
                        }
                    })

                    // 關鍵字背景色產生器
                    function randomRgba(){
                        let rgba = ''
                        for(i = 0; i < 3; i++){
                            if(i == 2){
                                rgba += `${Math.floor(Math.random() * 256)}`
                            }else{
                                rgba += `${Math.floor(Math.random() * 256)}, `
                            }
                        }
                        return rgba
                    }

                    // 關鍵字顏色產生器
                    function entityTextColor(rgba){
                        const rgbaCode = rgba.trim().split(',')
                        let textColor = ''
                        const maxNum = rgbaCode.filter(code => code >= 128)
                        if(maxNum.length){
                            for(i = 0; i < rgbaCode.length; i++){
                                if((rgbaCode[i] - 50) < 0){
                                    rgbaCode[i] = 0
                                }else{
                                    rgbaCode[i] = rgbaCode[i] - 50
                                }
                            }
                        }else{
                            for(i = 0; i < rgbaCode.length; i++){
                                if((rgbaCode[i] + 50) > 255){
                                    rgbaCode[i] = 255
                                }else{
                                    rgbaCode[i] = rgbaCode[i] + 50
                                }
                            }
                        }

                        for(i = 0; i < rgbaCode.length; i++){
                            if(i == (rgbaCode.length - 1)){
                                textColor += `${rgbaCode[i]}`
                            }else{
                                textColor += `${rgbaCode[i]}, `
                            }
                        }
                        
                        return textColor
                    }

                    // 例句文字顏色
                    // 例句title產生顏色後回傳titleInfo
                    // 例句呼叫此函數時，帶入titleInfo，這樣例句顏色就會跟title一樣
                    function createTextHtml(item, userText, titleInfo){
                        let currentUserText = '' 
                        let textTmp = '' 
                        let testText ='' 
                        let bkgColor = ''
                        let textColor = ''
                        let colorObj = {}

                        item.entities.forEach(entityEle => {
                            if(entityEle.start > 0 && currentUserText == ''){
                                textTmp = userText.slice(0, entityEle.start)
                                currentUserText = `
                                    <span>${textTmp}</span>
                                `
                                testText = textTmp
                            }

                            if((entityEle.start - testText.length) > 0){
                                textTmp = userText.slice(testText.length, entityEle.start)
                                currentUserText += `
                                    <span>${textTmp}</span>
                                `
                                testText += textTmp
                            }

                            textTmp = userText.slice(entityEle.start, entityEle.end)
                            testText += textTmp

                            if(!titleInfo){
                                bkgColor = randomRgba()
                                textColor = entityTextColor(bkgColor)
                                colorObj[entityEle.entity] = {bkgColor, textColor}
                                currentUserText += `
                                    <span>
                                        <div class="entity-label" style="background: rgba(${bkgColor}, 0.5);">
                                            <span class="entity-name" style="display:none;">
                                                ${entityEle.entity}
                                            </span>
                                            <div>
                                                <span id="entity-text">
                                                    ${textTmp}
                                `
                                if(textTmp != entityEle.value){
                                    currentUserText += `
                                    <span class="value-synonym" id="entity-value" style="color: rgb(${textColor});font-weight: bold;">≪"${entityEle.value}"≫</span>
                                    `
                                }
                            }else{
                                bkgColor = titleInfo[entityEle.entity].bkgColor
                                textColor = titleInfo[entityEle.entity].textColor
                                currentUserText += `
                                    <span>
                                        <div class="examples-entity-label" style="background: rgba(${bkgColor}, 0.5);">
                                            <span class="examples-entity-box entity-info" style="display:none;">
                                                    <span class="examples-entity-title entity-info">編輯關鍵字資訊</span>
                                                    <div>
                                                        <label for="entity-code-input" class="entity-info">代號</label>
                                                        <input id="entity-code-input" type="text" class="form-control entity-info" value="${entityEle.entity}">
                                                        <button type="button" id="entity-code-removeBtn" class="btn btn-danger entity-info"><i class="fas fa-trash-alt"></i></button>
                                                    </div>
                                `

                                if(textTmp != entityEle.value){
                                    currentUserText += `
                                        <div>
                                            <label for="entity-value-input" class="entity-info">代表值</label>
                                            <input id="entity-value-input" type="text" class="form-control entity-info" value="${entityEle.value}">
                                            <button type="button" id="entity-value-removeBtn" class="btn btn-danger entity-info"><i class="fas fa-trash-alt"></i></button>
                                        </div>
                                    `
                                }else{
                                    currentUserText += `
                                        <div class="entity-option-btns entity-info">
                                            <button type="button" id="entity-value-addBtn" class="btn btn-info entity-info"><i class="fas fa-plus" style="margin-right: 5px;"></i>代表值</button>
                                        </div>
                                    `
                                }
                                
                                currentUserText += `
                                    </span>
                                    <div>
                                        <span id="examples-entity-text">
                                            ${textTmp}
                                `
                                
                                if(textTmp != entityEle.value){
                                    currentUserText += `
                                    <span class="value-synonym" id="examples-entity-value" style="color: rgb(${textColor});font-weight: bold;">≪"${entityEle.value}"≫</span>
                                    `
                                }
                            }

                            currentUserText += `
                                            </span>
                                        </div>
                                    </div>
                                </span>
                            `
                        })
                        if(userText.length - testText.length > 0){
                            textTmp = userText.slice(testText.length, userText.length)
                            currentUserText += `
                                <span>${textTmp}</span>
                            `
                            testText += textTmp
                        }
                        return {text: currentUserText, titleInfo: colorObj}
                    }
                })
                .catch(err => console.log(err))
            }
        })

        // userInput焦點事件
        input.addEventListener('focus', e => {
            const target = e.target
            target.setAttribute('data-event', 'blur')
            target.setAttribute('data-status', 'typing')
        })

        // userInput鍵盤事件
        input.addEventListener('keydown', e => {
            const target = e.target;

            if(!target.value || target.value.trim() == '') return

            if(e.keyCode == 13){
                // 獲取輸入框在陣列中的位置
                let indexNum = 0
                const allStorySpan = document.querySelectorAll('#storySpan')
                for(i = 0; i < allStorySpan.length; i++){
                    if(allStorySpan[i].childNodes[0].dataset.status == 'typing'){
                        indexNum = i
                    }
                }

                target.setAttribute('data-event', 'keydown')
                if(document.querySelector('#storyTitle').innerText == '未命名故事'){
                    target.setAttribute('data-status', 'waiting')
                    target.value = ''
                    var html = "<h2><div class='sa-icon warning'><span></span></div>請先設定故事名稱</h2>";
                    Method.common.showBox(html, 'message', '')
                    return
                }

                fetch(`http://localhost:3030/jh_story/parse?userInput=${target.value}`)
                .then(response => {
                    return response.json();
                })
                .then(data => {
                    const storyName = document.querySelector('#storyTitle').innerText
                    // 串接後端API新增故事流程
                    fetch(`http://localhost:3030/jh_story/userStep/fragments/insert?parse=${JSON.stringify(data)}&storyName=${storyName}&indexNum=${indexNum}`)
                    .then(response => response.json())
                    .then(info => {
                        if(info.status == 'success'){
                            // 新增nlu
                            fetch(`http://localhost:3030/jh_story/userStep/nlu/insert?parse=${JSON.stringify(data)}`)
                            .catch(err => console.log(err))

                            // 新增domain
                            fetch(`http://localhost:3030/jh_story/userStep/domain/insert?parse=${JSON.stringify(data)}`)
                            .catch(err => console.log(err))

                            target.value = `${target.value}`;
                            target.setAttribute('data-status', 'waiting')
                            target.setAttribute('disabled', '');
                            target.setAttribute('style', 'cursor: pointer;')
                            showNluSpan(data, allStorySpan, indexNum)
                        }
                    })
                    .catch(err => console.log(err))
                })
                .catch(err => console.log(err))
            }
        })

        // userInput失焦事件
        input.addEventListener('blur', e => {
            const target = e.target;

            // 獲取輸入框在陣列中的位置
            let indexNum = 0
            const allStorySpan = document.querySelectorAll('#storySpan')
            for(i = 0; i < allStorySpan.length; i++){
                if(allStorySpan[i].childNodes[0].dataset.status == 'typing'){
                    indexNum = i
                }
            }

            if(target.dataset.event != 'blur') return
            if(target.value == ''){
                target.setAttribute('data-status', 'waiting')
                target.parentElement.parentElement.remove();
            }else{
                if(document.querySelector('#storyTitle').innerText == '未命名故事'){
                    target.setAttribute('data-status', 'waiting')
                    target.value = ''
                    var html = "<h2><div class='sa-icon warning'><span></span></div>請先設定故事名稱</h2>";
                    Method.common.showBox(html, 'message', '')
                    return
                }
                fetch(`http://localhost:3030/jh_story/parse?userInput=${target.value}`)
                .then(response => {
                    return response.json();
                })
                .then(data => {
                    const storyName = document.querySelector('#storyTitle').innerText
                    fetch(`http://localhost:3030/jh_story/userStep/fragments/insert?parse=${JSON.stringify(data)}&storyName=${storyName}&indexNum=${indexNum}`)
                    .then(response => response.json())
                    .then(info => {
                        if(info.status == 'success'){
                            // 新增nlu
                            fetch(`http://localhost:3030/jh_story/userStep/nlu/insert?parse=${JSON.stringify(data)}`)
                            .catch(err => console.log(err))

                            // 新增domain
                            fetch(`http://localhost:3030/jh_story/userStep/domain/insert?parse=${JSON.stringify(data)}`)
                            
                            .catch(err => console.log(err))
                            target.value = `${target.value}`;
                            target.setAttribute('data-status', 'waiting');
                            target.setAttribute('disabled', '');
                            showNluSpan(data, allStorySpan, indexNum)
                        }
                    })
                    .catch(err => console.log(err))
                })
                .catch(err => console.log(err))
            }
        })
    }

    // 點擊機器人按鈕
    function clickBotBtn(){
        const stories = document.querySelector('#stories');
        const storyDiv = document.createElement('div');
        storyDiv.setAttribute('id', 'storyDiv');
        storyDiv.setAttribute('class', 'botRes');
        storyDiv.setAttribute('style', 'margin-left: 20%;border: 1px solid transparent;border-radius: 5px')

        const storySpan = document.createElement('span');
        storySpan.setAttribute('id', 'storySpan');

        const input = document.createElement('input');
        input.setAttribute('placeholder', '機器人回覆....');
        input.setAttribute('name', 'botInput');
        input.setAttribute('id', 'botInput');
        input.setAttribute('class', 'form-control story-bot');
        input.setAttribute('data-status', 'waiting')

        const removeBtn = document.createElement('button');
        removeBtn.setAttribute('type', 'button');
        removeBtn.setAttribute('id', 'removeBtn');
        removeBtn.setAttribute('class', 'btn btn-danger');

        const removeIcon = document.createElement('i');
        removeIcon.setAttribute('class', 'fas fa-trash-alt');
        removeIcon.setAttribute('style', 'font-size: 7px;')
        removeBtn.appendChild(removeIcon);

        removeBtn.onclick = function(e){
            const target = e.target;
            if(target.matches('#removeBtn')){
                target.parentElement.parentElement.parentElement.remove();
            }

            if(target.tagName == 'svg'){
                target.parentElement.parentElement.parentElement.parentElement.remove();
            }

            if(target.tagName == 'path'){
                target.parentElement.parentElement.parentElement.parentElement.parentElement.remove();
            }
        }

        const btnSpan = document.createElement('span');
        btnSpan.appendChild(removeBtn);

        const topRightDiv = document.createElement('div');
        topRightDiv.setAttribute('class', 'top-right');
        topRightDiv.setAttribute('style', 'max-width: 100px;position: absolute;top: 9px;right: 9px;visibility: hidden;');
        topRightDiv.appendChild(btnSpan);

        const resName = document.createElement('div');
        resName.setAttribute('class', 'res-name');
        resName.setAttribute('style', 'display: flex;');

        const resNameInputDiv = document.createElement('div');
        resNameInputDiv.setAttribute('class', 'res-name-input-div');
        
        const resNameInput = document.createElement('input');
        resNameInput.setAttribute('id', 'res-name-input');
        resNameInputDiv.appendChild(resNameInput);
        resName.appendChild(resNameInputDiv);

        const bottomRightDiv = document.createElement('div');
        bottomRightDiv.setAttribute('class', 'bottom-right');
        bottomRightDiv.setAttribute('data-isFocus', 'false');
        bottomRightDiv.setAttribute('style', 'position: absolute;right: 9px;bottom: 9px;visibility: hidden;');
        bottomRightDiv.appendChild(resName);

        storySpan.appendChild(input);
        storyDiv.appendChild(storySpan);
        storyDiv.appendChild(topRightDiv);
        storyDiv.appendChild(bottomRightDiv);
        stories.insertBefore(storyDiv, stories.lastElementChild);

        bottomRightDiv.addEventListener('mousemove', e => {
            const target = e.target;
            if(target.matches('#res-name-input')){
                target.style.border = '1px solid #ccc';
            }
        })

        bottomRightDiv.addEventListener('mouseleave', e => {
            const target = e.target;
            if(target.dataset.isfocus == 'false'){
                target.children[0].children[0].children[0].style.border = 'none';
            }
        })

        resNameInput.addEventListener('focus', e => {
            const target = e.target;
            target.parentElement.parentElement.parentElement.dataset.isfocus = 'true';
        })

        resNameInput.addEventListener('blur', e => {
            const target = e.target;
            target.parentElement.parentElement.parentElement.dataset.isfocus = 'false';
            if(bottomRightDiv.dataset.ismouseleave == 'true'){
                target.parentElement.parentElement.parentElement.style.visibility = 'hidden';
            }else{
                target.style.border = 'none';
            }
            
        })

        input.onchange = function(){
            console.log(input.value)
        }

        resNameInput.value = randomBotResName()

        resNameInput.onchange = function(){
            console.log(resNameInput.value)
        }
    }

    // 點擊意圖按鈕
    function clickIntentBtn(storyContainer, targetInput){
        if(document.querySelector('#storyTitle').innerText == '未命名故事'){
            var html = "<h2><div class='sa-icon warning'><span></span></div>請先設定故事名稱</h2>";
            Method.common.showBox(html, 'message', '')
            return
        }
        const prop = prompt(`請輸入意圖`, '');
        if(prop != '' && prop != null){
            const storyName = document.querySelector('#storyTitle').innerText
            fetch(`http://localhost:3030/jh_story/userStep/intent/insert?intent=${prop}&storyName=${storyName}`)
            .then(response => response.json())
            .then(info => {
                if(info.status == 'success'){
                    showIntent(prop, storyContainer)
                    targetInput.nextElementSibling.classList.toggle('mt-10')
                    targetInput.remove()
                }else{
                    const html = "<h2><div class='sa-icon error'><span></span></div>系統錯誤</h2>";
                    Method.common.showBox(html, 'message', '');
                }
            }).catch(err => console.log(err))
        }else{
            if(prop != null){
                const html = "<h2><div class='sa-icon warning'><span></span></div>意圖不能為空白</h2>";
                Method.common.showBox(html, 'message', '');
            }
        }
    }

    // 機器人回覆名稱產生器
    function randomBotResName(){
        const lower = 'abcdefghijklmnopqrstuvwxyz'
        const upper = lower.toUpperCase()
        const num = '1234567890'
        const randomText = lower + upper + num
        let text = 'utter_'
        for(i = 0; i < 9; i++){
            text += randomText[Math.floor(Math.random() * randomText.length)]
        }
        return text
    }

    // 建立並顯示意圖和關鍵字
    function showNluSpan(data, allStorySpan, indexNum){
        showIntent(data.intent.name, allStorySpan, indexNum)

        data.entities.map(item => {
            const entitiesSpan = document.createElement('span')
            entitiesSpan.setAttribute('id', 'entities-span')
            entitiesSpan.setAttribute('class', 'nluSpan mt-10')

            const entityIcon = document.createElement('i');
            entityIcon.setAttribute('class', 'fas fa-key');
            entityIcon.setAttribute('style', 'font-size: 9px;');

            const entityText = document.createElement('span')
            entityText.setAttribute('id', 'entity-text')
            entityText.setAttribute('class', 'nluText')

            const keyWord = data.text.slice(item.start, item.end)

            entityText.innerHTML = `關鍵字: <span id="entity">${keyWord}</span>, 代號: <span id="entity--code">${item.entity}</span>, 代表值: <span id="entity--value">${item.value}</span>`
            entitiesSpan.appendChild(entityIcon)
            entitiesSpan.appendChild(entityText)
            allStorySpan[indexNum].appendChild(entitiesSpan)
        })
    }

    // 建立並顯示意圖
    function showIntent(intentName, allStorySpan, indexNum){
        const intentSpan = document.createElement('span')
        intentSpan.setAttribute('id', 'intent-span')
        intentSpan.setAttribute('class', 'nluSpan mt-10')

        const intentIcon = document.createElement('i');
        intentIcon.setAttribute('class', 'fas fa-tag');
        intentIcon.setAttribute('style', 'font-size: 7px;');

        const intentText = document.createElement('span')
        intentText.setAttribute('id', 'intent-text')
        intentText.setAttribute('class', 'nluText')
        intentText.innerText = `意圖: ${intentName}`

        intentSpan.appendChild(intentIcon)
        intentSpan.appendChild(intentText)
        allStorySpan[indexNum].appendChild(intentSpan)

        // 意圖點擊事件
        intentSpan.addEventListener('click', e => {
            const target = e.target
            let examText = ``
            let intent = ``
            // 抓取使用者例句及意圖
            if(target.matches('#intent-span')){
                examText = target.previousSibling.value
                intent = target.lastChild.innerText.slice(4, target.lastChild.innerText.length)
            }else if(target.matches('#intent-text') || target.tagName == 'svg'){
                examText = target.parentElement.previousSibling.value
                intent = target.innerText.slice(4, target.innerText.length)
                if(target.tagName == 'svg'){
                    intent = target.nextElementSibling.innerText.slice(4, target.nextElementSibling.innerText.length)
                }
            }else{
                examText = target.parentElement.parentElement.previousSibling.value
                intent = target.parentElement.nextElementSibling.innerText.slice(4, target.parentElement.nextElementSibling.innerText.length)
            }

            let intentHtml = ``
            let entitiesHtml = ``
            // 串接後端API抓取所有意圖
            fetch(`http://localhost:3030/jh_story/userStep/nlu/getIntent`)
            .then(response => response.json())
            .then(intents => {
                for(i = 0; i < intents.length; i++){
                    if(intents[i] == intent){
                        intentHtml += `
                            <div class="setExamInfo--intents_item selected">
                                <span class="item--container">
                                    ${intents[i]}
                                </span>
                            </div>
                        `
                    }else{
                        intentHtml += `
                            <div class="setExamInfo--intents_item">
                                <span class="item--container">
                                    ${intents[i]}
                                </span>
                            </div>
                        `
                    }
                }

                intentHtml += `
                    <div class="setExamInfo--intents_item create-intent">
                        <span class="item--container create-intent">
                            建立新意圖
                        </span>
                    </div>

                    <div class="setExamInfo--intents_item cancel">
                        <span class="item--container cancel">
                            取消
                        </span>
                    </div>
                `

                fetch(`http://localhost:3030/jh_story/userStep/nlu/setEntity/getTextExam?examText=${examText}`)
                .then(response => response.json())
                .then(targetNlu => {
                    // targetNlu是陣列，所以需要選擇0的位置
                    entitiesHtml = createEntitiesHtml(targetNlu[0], examText)

                    // 關鍵字html產生 function
                    function createEntitiesHtml(data, examText){
                        let entitiesHtmlLoop = ''
                        if(data.entities.length){
                            for(i = 0; i < data.entities.length; i++){
                                const keyWord = examText.slice(data.entities[i].start, data.entities[i].end) 
                                if(data.entities[i].value == keyWord){
                                    entitiesHtmlLoop += `
                                        <div class="entity--container">
                                            <span class="entity--text">
                                                關鍵字：<span id="entity">${keyWord}</span>, 
                                                代號：<span id="entity--code">${data.entities[i].entity}</span>
                                            </span>
                                            <button type="button" class="btn-danger entity--remove_btn"><i class="fas fa-trash-alt"></i></button>
                                        </div>
                                    `
                                }else{
                                    entitiesHtmlLoop += `
                                        <div class="entity--container">
                                            <span class="entity--text">
                                                關鍵字: <span id="entity">${keyWord}</span>, 
                                                代號: <span id="entity--code">${data.entities[i].entity}</span>, 
                                                代表值: <span id="entity--value">${data.entities[i].value}</span>
                                            </span>
                                            <button type="button" class="btn-danger entity--remove_btn"><i class="fas fa-trash-alt"></i></button>
                                        </div>
                                    `
                                }
                            }
                        }else{
                            entitiesHtmlLoop = ''
                        }
                        return entitiesHtmlLoop
                        
                        // data.entities.map(item => {
                        //     const keyWord = examText.slice(item.start, item.end)
                        //     if(item.value == keyWord){
                        //         entitiesHtml += `
                        //             <div class="entity--container">
                        //                 <span class="entity--text">
                        //                     關鍵字：<span id="entity">${keyWord}</span>, 
                        //                     代號：<span id="entity--code">${item.entity}</span>
                        //                 </span>
                        //                 <button type="button" class="btn-danger entity--remove_btn"><i class="fas fa-trash-alt"></i></button>
                        //             </div>
                        //         `
                        //     }else{
                        //         entitiesHtml += `
                        //             <div class="entity--container">
                        //                 <span class="entity--text">
                        //                     關鍵字: <span id="entity">${keyWord}</span>, 
                        //                     代號: <span id="entity--code">${item.entity}</span>, 
                        //                     代表值: <span id="entity--value">${item.value}</span>
                        //                 </span>
                        //                 <button type="button" class="btn-danger entity--remove_btn"><i class="fas fa-trash-alt"></i></button>
                        //             </div>
                        //         `
                        //     }
                        //     return entitiesHtml
                        // })
                    }
                    
                    let html = ``

                    html += `
                        <div>
                            <h1>意圖及關鍵字設定</h1>
                            <span class="setExamInfo--content">
                                <input class="setExamInfo--examText form-control" value="${examText}" readonly>
                                <span class="setExamInfo--intents">
                                    <input id="intentInput" name="intentInput" type="text" class="form-control" placeholder="請選擇意圖或新增意圖">
                                    <span class="setExamInfo--intents_list list--disabled">${intentHtml}</span>
                                </span>
                                <span class="setExamInfo--entities">
                                    ${entitiesHtml}
                                </span>
                            </span>
                            <span class="setExamInfo--footer">
                                <button id="save" type="button" class="btn btn-info">儲存</button>
                            </span>
                        </div>
                    `
                    Method.common.showBox(html, "setExamInfo")

                    entitiesEvent()

                    function entitiesEvent(){
                        // 意圖輸入框焦點事件
                        // 顯示意圖選擇器
                        document.querySelector('#intentInput').addEventListener('focus', e => {
                            const target = e.target
                            target.nextElementSibling.classList.remove('list--disabled')
                        })

                        // 意圖輸入框點擊事件
                        // 因輸入框為disabled時點擊事件無法運作，所以將點擊事件綁在父層
                        document.querySelector('.setExamInfo--intents').addEventListener('click', e => {
                            const target = e.target
                            if(target.matches('#intentInput') && target.getAttribute('disabled') == ''){
                                target.removeAttribute('disabled')
                                target.focus()
                            }
                        })

                        // 意圖清單點擊事件
                        document.querySelector('.setExamInfo--intents_list').addEventListener('click', e => {
                            const target = e.target

                            // 意圖點擊事件(外框)
                            if(target.matches('.setExamInfo--intents_item') && !target.matches('.create-intent') && !target.matches('.cancel')){
                                const intentInput = document.querySelector('#intentInput')
                                if(!target.matches('.selected')){
                                    document.querySelector('.selected').classList.remove('selected')
                                    target.classList.add('selected')
                                }
                                target.parentElement.classList.add('list--disabled')
                                editExamInfo(target.innerText.trim(), intentInput)
                            }

                            // 意圖點擊事件(文字)
                            if(target.matches('.item--container') && !target.matches('.create-intent') && !target.matches('.cancel')){
                                if(!target.parentElement.matches('.selected')){
                                    document.querySelector('.selected').classList.remove('selected')
                                    target.parentElement.classList.add('selected')
                                }
                                target.parentElement.parentElement.classList.add('list--disabled')
                                editExamInfo(target.innerText.trim(), intentInput)
                            }

                            // 取消按鈕點擊事件
                            if(target.matches('.cancel')){
                                if(target.matches('.setExamInfo--intents_item')){
                                    target.parentElement.classList.add('list--disabled')
                                }else{
                                    target.parentElement.parentElement.classList.add('list--disabled')
                                }
                            }

                            // 意圖點擊 function
                            function editExamInfo(intent, input){
                                input.value = intent
                                input.setAttribute('disabled', '')
                            }
                        })

                        // tempNlu深層拷貝targetNlu，更改tempNlu值不會影響原始targetNlu，所以可以當作儲存前的操作資料
                        const tempNlu = JSON.parse(JSON.stringify(targetNlu[0]))
                        entitiesRemoveBtnEvent(tempNlu)

                        // 關鍵字刪除按鈕點擊事件
                        function entitiesRemoveBtnEvent(tempNlu){
                            const allEntityRemoveBtns = document.querySelectorAll('.entity--remove_btn')
                            allEntityRemoveBtns.forEach(removeBtn => {
                                removeBtn.addEventListener('click' , e => {
                                    const target = e.target
                                    let entityCode = ''
                                    // 刪除畫面的關鍵字顯示及tempNlu內的entity
                                    if(target.matches('.entity--remove_btn')){
                                        const entitySpan = target.parentElement.children[0]
                                        entityCode = entitySpan.children[1].innerText
                                        tempNlu.entities = tempNlu.entities.filter(item => {
                                            if(item.entity != entityCode){
                                                return item
                                            }
                                        })
                                        target.parentElement.remove()
                                    }
                
                                    if(target.tagName == 'svg'){
                                        const entitySpan = target.parentElement.parentElement.children[0]
                                        entityCode = entitySpan.children[1].innerText
                                        tempNlu.entities = tempNlu.entities.filter(item => {
                                            if(item.entity != entityCode){
                                                return item
                                            }
                                        })
                                        target.parentElement.parentElement.remove()
                                    }
                
                                    if(target.tagName == 'path'){
                                        const entitySpan = target.parentElement.parentElement.parentElement.children[0]
                                        entityCode = entitySpan.children[1].innerText
                                        tempNlu.entities = tempNlu.entities.filter(item => {
                                            if(item.entity != entityCode){
                                                return item
                                            }
                                        })
                                        target.parentElement.parentElement.parentElement.remove()
                                    }
                                })
                            })
                        }

                        createEntity(tempNlu)

                        // 使用者選取文字function
                        function createEntity(){
                            if(document.querySelector('.setExamInfo--examText')){
                                let m_MouseDown = false
                                const examContent = document.querySelector('.setExamInfo--content')
                    
                                // 使用者選取開始
                                examContent.addEventListener('mousedown', e => {
                                    const target = e.target
                                    if(target.matches('.setExamInfo--examText')){
                                        m_MouseDown = true
                                    }
                                })
                    
                                // 使用者選取結束
                                examContent.addEventListener('mouseup', e => {
                                    const target = e.target
                                    if(target.matches('.setExamInfo--examText')){
                                        m_MouseDown = false
                                        if(getText().text){
                                            setEntityBox(tempNlu, getText().text, getText().start, getText().end)
                                        }
                                    }
                                })
                    
                                // 回傳選取的文字
                                function getText(){
                                    const elem = document.querySelector('.setExamInfo--examText')
                                    return {text:elem.value.substring(elem.selectionStart, elem.selectionEnd), start: elem.selectionStart, end: elem.selectionEnd}
                                }

                                // 設定關鍵字彈跳窗
                                function setEntityBox(tempNlu, getText, start, end){
                                    // 驗證關鍵字是否重複
                                    for(i = 0; i < tempNlu.entities.length; i++){
                                        // 抓取關鍵字
                                        const keyWord = tempNlu.text.slice(tempNlu.entities[i].start, tempNlu.entities[i].end)
                                        // 將關鍵字及使用者選取的字串轉成array
                                        const keyWordArr = Array.from(keyWord)
                                        const textArr = Array.from(getText)
                                        // 將轉成array的字串進行比對
                                        for(j = 0; j < keyWordArr.length; j++){
                                            for(k = 0; k < textArr.length; k++){
                                                if(keyWordArr[j] == textArr[k]){
                                                    var warningHtml = "<h2><div class='sa-icon warning'><span></span></div>所選關鍵字與其他關鍵字重疊，請重新嘗試</h2>";
                                                    Method.common.showBox(warningHtml, 'message', '')
                                                    return
                                                }
                                            }
                                        }
                                    }
                                    const html = `
                                        <h1>設定關鍵字</h1>
                                        <form action="" name="setEntity">
                                            <div>
                                                <label for="entity-code">『${getText}』的關鍵字代號</label>
                                                <input type="text" class="form-control" name="entity-code" id="entity-code" placeholder="請輸入關鍵字代號，僅能使用英文">
                                            </div>
                                            <div>
                                                <label for="entity-value">『${getText}』的關鍵字代表值</label>
                                                <input type="text" class="form-control" name="entity-value" id="entity-value" placeholder="請輸入關鍵字代表值，空白的話，『${getText}』即為代表值">
                                            </div>
                                            <div>
                                                <button id="sendEntity" type="button" class="btn btn-info">送出</button>
                                            </div>
                                        </form>
                                    `
                                    Method.common.showBox(html,"setEntityBox");

                                    // 驗證關鍵字代號是否只有英文、數字或_
                                    document.querySelector('#entity-code').addEventListener('change', e => {
                                        const target = e.target
                                        const regex = /\{|\[|\]|\'|\"\;|\:\?|\\|\/|\.|\,|\>|\<|\=|\+|\-|\(|\)|\!|\@|\#|\$|\%|\^|\&|\*|\`|\~|[\u4E00-\u9FA5]/g
                                        if(regex.test(target.value)){
                                            target.value = ''
                                            var warningHtml = "<h2><div class='sa-icon warning'><span></span></div>關鍵字代號僅能輸入英文、數字和_</h2>";
                                            Method.common.showBox(warningHtml, 'message', '')
                                            return
                                        }
                                    })

                                    // 驗證關鍵字代表值是否有特殊符號
                                    document.querySelector('#entity-value').addEventListener('change', e => {
                                        const target = e.target
                                        const regex = /\{|\[|\]|\'|\"\;|\:\?|\\|\/|\.|\,|\>|\<|\=|\+|\-|\(|\)|\!|\@|\#|\$|\%|\^|\&|\*|\`|\~/g
                                        if(regex.test(target.value)){
                                            target.value = ''
                                            var warningHtml = "<h2><div class='sa-icon warning'><span></span></div>關鍵字代表值不能有特殊符號</h2>";
                                            Method.common.showBox(warningHtml, 'message', '')
                                            return
                                        }
                                    })
                                    
                                    // 送出關鍵字事件
                                    document.querySelector('#sendEntity').addEventListener('click', e => {
                                        const target = e.target
                                        console.log(tempNlu)
                                        const entityCode = target.parentElement.parentElement.children[0].children[1].value
                                        let entityValue = target.parentElement.parentElement.children[1].children[1].value
                                        if(entityValue == '') {
                                            entityValue = getText
                                        }
                                        const newEntityInfo = {
                                            entity: entityCode,
                                            value: entityValue,
                                            start,
                                            end
                                        }
                                        tempNlu.entities.push(newEntityInfo)
                                        const newEntitiesHtml = createEntitiesHtml(tempNlu, examText)
                                        document.querySelector('#setEntityBox').remove()
                                        document.querySelector('.setExamInfo--entities').innerHTML = newEntitiesHtml
                                        entitiesRemoveBtnEvent(tempNlu)
                                    })
                                }
                            }
                        }
                    }
                })
                .catch(err => console.log(err))
            })
            .catch(err => console.log(err))
        })
    }
}

// 修改故事名稱按鈕
Method.button.editStoryTitle = function(){
    if(document.querySelector('.jh_new_story')){
        storyTitleEdit.addEventListener('click', e => {
            const originalTitle = storyTitle.innerText
            const updateTitle = prompt('請輸入故事名稱', '')

            if(updateTitle == null) return 

            if(updateTitle == ''){
                var html = "<h2><div class='sa-icon warning'><span></span></div>故事名稱不可為空白</h2>";
                Method.common.showBox(html, 'message', '')
                return
            }

            fetch(`http://localhost:3030/jh_story/storyTitle/update?originalTitle=${originalTitle}&updateTitle=${updateTitle}`)
            .then(response => response.json())
            .then(data => {
                if(data.status){
                    var html = "<h2><div class='sa-icon " + data.status + "'><span></span></div>" + data.message + "</h2>";
                    Method.common.showBox(html, 'message', '')
                    return
                }
                storyTitle.innerText = data.updateTitle
            })
            .catch(err => console.log(err))
        })
    }
}

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

            if(document.querySelector(".jh_conversations")){
                url += "/jh_conversations/filter";
            };

            if(document.querySelector(".jh_story")){
                url += "/jh_story/filter";
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
            Method.common.multiIntent();
            Method.common.getStoryTitle();
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
        var enName = document.querySelectorAll(".enName");
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

// 抓取故事流程名稱
Method.common.getStoryTitle = function(){
    if(document.querySelector('.jh_new_story')){
        const titleContainer = document.querySelector('#title-container')

        // 預設文字內容
        if(!storyTitle.innerText){
            storyTitle.innerText = '未命名故事'
        }

        // 當進入此區塊時，storyTitle改成可編輯狀態並獲取焦點
        titleContainer.addEventListener('mouseenter', e => {
            if(storyTitle.innerText == '未命名故事'){
                storyTitle.setAttribute('contenteditable', 'true')
                storyTitle.setAttribute('data-event', 'blur')
                storyTitle.focus()
            }else{
                // 故事名稱設定完後，改成顯示編輯故事名稱按鈕
                if(storyTitle.getAttribute('contenteditable') == 'false'){
                    tittleBtn.style.opacity = '1';
                    tittleBtn.style.transition = 'opacity .1s ease-in-out';
                    tittleBtn.children[0].removeAttribute('disabled')
                }
            }
        })

        // 隱藏故事名稱按鈕
        titleContainer.addEventListener('mouseleave', e => {
            if(storyTitle.innerText != '未命名故事' && storyTitle.getAttribute('contenteditable') == 'false'){
                tittleBtn.style.opacity = '0';
                tittleBtn.style.transition = 'opacity .1s ease-in-out';
                tittleBtn.children[0].setAttribute('disabled', '')
            }
        })

        // 當storyTitle獲取焦點時，選取storyTitle的內容以便修改
        storyTitle.addEventListener('focus', e => {
            const target = e.target
            const selection = window.getSelection()
            const range = document.createRange()
            range.selectNodeContents(target)
            selection.removeAllRanges()
            selection.addRange(range)
        })

        // 當storyTitle失焦的事件
        storyTitle.addEventListener('blur', e => {
            const target = e.target
            storyTitle.setAttribute('contenteditable', 'false')
            if(!storyTitle.innerText || storyTitle.innerText == ''){
                storyTitle.innerText = '未命名故事'
            }
            if(storyTitle.dataset.event == 'blur'){
                fetch(`http://localhost:3030/jh_story/storyTitle?storyTitle=${target.innerText}`)
                .then(response => {
                    return response.json()
                })
                .then(info => {
                    if(info.status != 'success'){
                        target.setAttribute('contenteditable', 'true')
                        target.innerText = '未命名故事'
                        var html = "<h2><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "</h2>";
                        Method.common.showBox(html, 'message', '')
                    }
                })
                .catch(err => console.log(err))
            }
        })

        // 當輸入完故事名稱按下enter的事件
        storyTitle.addEventListener('keydown', e => {
            const target = e.target
            if(e.keyCode == 13){
                e.preventDefault()  // 阻止換行
                e.stopPropagation() // 阻止換行
                target.setAttribute('data-event', 'keydown')
                target.setAttribute('contenteditable', 'false')
                if(!target.innerText || target.innerText == ''){
                    target.innerText = '未命名故事'
                }
                fetch(`http://localhost:3030/jh_story/storyTitle?storyTitle=${target.innerText}`)
                .then(response => {
                    return response.json()
                })
                .then(info => {
                    if(info.status != 'success'){
                        target.setAttribute('contenteditable', 'true')
                        target.innerText = '未命名故事'
                        var html = "<h2><div class='sa-icon " + info.status + "'><span></span></div>" + info.message + "</h2>";
                        Method.common.showBox(html, 'message', '')
                    }
                })
                .catch(err => console.log(err))
            }
        })
    }
}

// 新增多意圖測試
Method.common.multiIntent = function(){
    if(document.querySelector('.jh_new_des')){
        if(document.querySelector('#cnName')){
            let m_MouseDown = false
            const cnNameInput = document.querySelector('#cnName')

            cnNameInput.addEventListener('mousedown', e => {
                m_MouseDown = true
            })

            cnNameInput.addEventListener('mouseup', e => {
                m_MouseDown = false
                if(getText()){
                    const prop = prompt(`請輸入「${getText()}」英文代號`, '')
                    if(prop != null && prop != ''){
                        document.querySelector('#entity_name').value = prop
                        const appendEle = document.createElement('div')

                        const appendLabel = document.createElement('label')
                        appendLabel.setAttribute('for', 'appendEntity')
                        appendLabel.innerText = `${getText()}的英文代號`
                        appendEle.appendChild(appendLabel)

                        const appendEntity = document.createElement('input')
                        appendEntity.setAttribute('disabled', '')
                        appendEntity.setAttribute('type', 'text')
                        appendEntity.setAttribute('class', 'form-control')
                        appendEntity.setAttribute('id', 'appendEntity')
                        appendEntity.value = prop
                        appendEle.appendChild(appendEntity)
                        const node = document.querySelector('#jh_new_des')
                        node.children[0].insertBefore(appendEle, node.children[0].children[0].nextElementSibling)
                    }
                }
            })

            function getText(){
                const elem = document.querySelector('#cnName')
                return elem.value.substring(elem.selectionStart, elem.selectionEnd)
            }
        }
    }
}