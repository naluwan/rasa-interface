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
    Method.button.addStoryButton();
    Method.button.editStoryButton();
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

// 新增故事頁 互動按鈕
Method.button.addStoryButton = function(){
    if(document.querySelector('.jh_new_story') || document.querySelector('.jh_new_simple_story')){
        const stories = document.querySelector('#stories');
        const btnDiv = document.querySelector('#btnDiv')
        const userBtn = document.querySelector('#userBtn')
        const botBtn = document.querySelector('#botBtn')

        Method.story.editStoryTitle()
        Method.story.getStoryTitle()
        
        Method.story.stepControlBtn(userBtn, botBtn)

        Method.story.showBorder(stories, btnDiv, userBtn, botBtn)
        
    }
}

// 查詢及編輯故事頁 互動按鈕
Method.button.editStoryButton = function(){
    if(document.querySelector('.jh_story') || document.querySelector('.jh_simple_story')){
        const storyFilter = document.querySelector('#storyFilter')
        const filterBtn = document.querySelector('#filterBtn')
        const btnDiv = document.querySelector('#btnDiv')
        const userBtn = document.querySelector('#userBtn')
        const botBtn = document.querySelector('#botBtn')
        const stories = document.querySelector('#stories')
        const storyRemoveBtn = document.querySelector('#storyRemoveBtn')
        if(storyFilter.value){
            // 因為畫面render會有一些延遲，所已設定0.5秒後才添加事件
            setTimeout(() => {
                /* 
                使用共用事件
                editStoryTitle - 編輯故事名稱
                getStoryTitle - 獲取故事名稱
                showBorder - 動態顯示
                stepControlBtn - 步驟控制按鈕
                clickStoryRemoveBtnEvent - 故事刪除按鈕
                */
                Method.story.editStoryTitle()
                Method.story.getStoryTitle()
                Method.story.showBorder(stories, btnDiv, userBtn, botBtn)
                Method.story.stepControlBtn(userBtn, botBtn)
                Method.story.clickStoryRemoveBtnEvent(storyRemoveBtn)

                // 使用者步驟的element
                const userStepRemoveBtns = document.querySelectorAll('.userStep #removeBtn')
                const userStepIntentBtns = document.querySelectorAll('.userStep #intentBtn')
                const userStepStorySpans = document.querySelectorAll('.userStep #storySpan')
                const userStepInputs = document.querySelectorAll('.userStep #userInput')
                const userStepIntentSpans = document.querySelectorAll('.userStep #intent-span')

                // 機器人步驟的element
                const botStepRemoveBtns = document.querySelectorAll('.botRes #removeBtn')
                const botStepBottomRightDivs = document.querySelectorAll('.botRes .bottom-right')
                const botStepResNameInputs = document.querySelectorAll('.botRes #res-name-input')
                const botStepResInputs = document.querySelectorAll('.botRes #botInput')

                // 添加機器人步驟事件
                Array.from(botStepRemoveBtns).map(botStepRemoveBtn => Method.story.botStep.removeBtnClickEvent(botStepRemoveBtn))
                Array.from(botStepBottomRightDivs).map(botStepBottomRightDiv => Method.story.botStep.resNameDivMouseEvent(botStepBottomRightDiv))
                Array.from(botStepResNameInputs).map(botStepResNameInput => Method.story.botStep.resNameInputEvent(botStepResNameInput))
                Array.from(botStepResInputs).map(botStepResInput => Method.story.botStep.resTextAreaEvent(botStepResInput))

                // 讓機器人對話框自適應內容高度
                Array.from(botStepResInputs).map(botStepResInput => {
                    botStepResInput.style.height = botStepResInput.scrollHeight + 20 + 'px'
                })

                // 需設定意圖
                if(document.querySelector('.jh_story')){
                    // 添加使用者步驟事件
                    Array.from(userStepRemoveBtns).map(userStepRemoveBtn => Method.story.userStep.removeBtnClickEvent(userStepRemoveBtn))
                    Array.from(userStepIntentBtns).map(userStepIntentBtn => Method.story.userStep.intentBtnClickEvent(userStepIntentBtn))
                    Array.from(userStepStorySpans).map(userStepStorySpan => Method.story.userStep.inputClickEvent(userStepStorySpan))
                    Array.from(userStepInputs).map(userStepInput => Method.story.userStep.inputEvent(userStepInput))
                    Array.from(userStepIntentSpans).map(userStepIntentSpan => Method.story.clickIntentSpanEvent(userStepIntentSpan))
                }

                // 不用設定意圖
                if(document.querySelector('.jh_simple_story')){
                    // 添加使用者步驟事件
                    Array.from(userStepRemoveBtns).map(userStepRemoveBtn => Method.story.userStep.simpleClickRemoveBtnEvent(userStepRemoveBtn))
                    Array.from(userStepStorySpans).map(userStepStorySpan => Method.story.userStep.simpleInputClickEvent(userStepStorySpan))
                    Array.from(userStepInputs).map(userStepInput => Method.story.userStep.simpleInputEvent(userStepInput))
                }

            }, 500)
            
        }
    }
}

// story共用function
Method.story = {
    // 使用者及機器人步驟按鈕事件
    stepControlBtn: (userBtn, botBtn) => {
        userBtn.addEventListener('click', e => {
            Method.story.clickUserBtn(stories);
        })
    
        botBtn.addEventListener('click', e => {
            Method.story.clickBotBtn(stories);
        })
    },
    // 使用者步驟共用function
    userStep: {
        // 所有使用者步驟事件
        allUserStepEvent: (removeBtn, intentBtn, storySpan, input) => {
            if(document.querySelector('.jh_new_story') || document.querySelector('.jh_story')){
                Method.story.userStep.removeBtnClickEvent(removeBtn)
                Method.story.userStep.intentBtnClickEvent(intentBtn)
                Method.story.userStep.inputClickEvent(storySpan)
                Method.story.userStep.inputEvent(input)
            }else{
                Method.story.userStep.simpleClickRemoveBtnEvent(removeBtn)
                Method.story.userStep.simpleInputClickEvent(storySpan)
                Method.story.userStep.simpleInputEvent(input)
            }
            
        },
        // 使用者步驟刪除按鈕事件
        removeBtnClickEvent: (removeBtn) => {
            // 刪除按鈕點擊事件
            removeBtn.addEventListener('click', e => {
                // storyName - 該頁面故事流程名稱
                const target = e.target;
                const storyName = document.querySelector('#storyTitle').innerText
        
                // userStoryDiv - 該點擊目標的故事流程步驟外框，用來刪除故事流程步驟用
                // text - 該點擊目標故事流程步驟，使用者輸入的文字
                // intent - 該點擊目標故事流程步驟，使用者的意圖，使用slice()是因為顯示文字時，在前方加上「意圖: 」，所以取意圖需要去除前4個字
                if(target.matches('#removeBtn')){
                    const userStoryDiv = target.parentElement.parentElement.parentElement
                    if(target.parentElement.parentElement.previousElementSibling.children[0].id == 'userInput'){
                        if(target.parentElement.parentElement.previousElementSibling.children[0].value){
                            const text = target.parentElement.parentElement.previousElementSibling.children[0].value
                            let intent = target.parentElement.parentElement.previousElementSibling.children[1].children[0].children[1].innerText
                            intent = intent.slice(4, intent.length)
                            removeUserStep(storyName, text, intent, userStoryDiv)
                        }else{
                            userStoryDiv.remove()
                        }
                    }else{
                        const text = ''
                        let intent = target.parentElement.parentElement.previousElementSibling.children[0].children[0].children[1].innerText
                        intent = intent.slice(4, intent.length)
                        removeUserStep(storyName, text, intent, userStoryDiv)
                    }
                }
        
                if(target.tagName == 'svg'){
                    const userStoryDiv = target.parentElement.parentElement.parentElement.parentElement
                    if(target.parentElement.parentElement.parentElement.previousElementSibling.children[0].id == 'userInput'){
                        if(target.parentElement.parentElement.parentElement.previousElementSibling.children[0].value){
                            const text = target.parentElement.parentElement.parentElement.previousElementSibling.children[0].value
                            let intent = target.parentElement.parentElement.parentElement.previousElementSibling.children[1].children[0].children[1].innerText
                            intent = intent.slice(4, intent.length)
                            removeUserStep(storyName, text, intent, userStoryDiv)
                        }else{
                            userStoryDiv.remove()
                        }
                    }else{
                        const text = ''
                        let intent = target.parentElement.parentElement.parentElement.previousElementSibling.children[0].children[0].children[1].innerText
                        intent = intent.slice(4, intent.length)
                        removeUserStep(storyName, text, intent, userStoryDiv)
                    }
                }
        
                if(target.tagName == 'path'){
                    const userStoryDiv = target.parentElement.parentElement.parentElement.parentElement.parentElement
                    if(target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[0].id == 'userInput'){
                        if(target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[0].value){
                            const text = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[0].value
                            let intent = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[1].children[0].children[1].innerText
                            intent = intent.slice(4, intent.length)
                            removeUserStep(storyName, text, intent, userStoryDiv)
                        }else{
                            userStoryDiv.remove()
                        }
                    }else{
                        const text = ''
                        let intent = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[0].children[0].children[1].innerText
                        intent = intent.slice(4, intent.length)
                        removeUserStep(storyName, text, intent, userStoryDiv)
                    }
                }
        
                // 移除故事流程function
                function removeUserStep(storyName, userSays, intent, userStoryDiv){
                    const payload = {
                        storyName,
                        userSays,
                        intent
                    }
                    fetch(`http://192.168.10.127:3030/jh_story/userStep/fragments`,{
                        method: 'delete',
                        body: JSON.stringify(payload),
                        headers: {
                            'Content-Type': "application/json",
                        },
                    })
                    .then(response => response.json())
                    .then(info => {
                        if(info.status == 'success'){
                            userStoryDiv.remove()
                        }
                    })
                    .catch(err => console.log(err))
        
                    fetch(`http://192.168.10.127:3030/jh_story/userStep/nlu/example`,{
                        method: 'delete',
                        body: JSON.stringify(payload),
                        headers: {
                            'Content-Type': "application/json",
                        },
                    })
                    .catch(err => console.log(err))
                }
            })
        },
        // 使用者步驟意圖按鈕事件
        intentBtnClickEvent: (intentBtn) => {
            // 點擊意圖按鈕事件
            intentBtn.addEventListener('click', e => {
                const target = e.target;
                let indexNum = 0
                let storyContainer
                let targetInput

                if(target.matches('#intentBtn')){
                    storyContainer = target.parentElement.parentElement.previousElementSibling
                    targetInput = target.parentElement.parentElement.previousElementSibling.childNodes[0]
                    storyContainer.children[0].setAttribute('data-status', 'typing')
                }

                if(target.tagName == 'svg'){
                    storyContainer = target.parentElement.parentElement.parentElement.previousElementSibling
                    targetInput = target.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0]
                    storyContainer.children[0].setAttribute('data-status', 'typing')
                }

                if(target.tagName == 'path'){
                    storyContainer = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling
                    targetInput = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.childNodes[0]
                    storyContainer.children[0].setAttribute('data-status', 'typing')
                }

                const allStorySpan = document.querySelectorAll('#storySpan')
                for(i = 0; i < allStorySpan.length; i++){
                    if(allStorySpan[i].childNodes[0].dataset.status == 'typing'){
                        indexNum = i
                    }
                }
                
                Method.story.clickIntentBtn(storyContainer, targetInput, allStorySpan, indexNum);
            })
        },
        // 使用者步驟點擊輸入框事件
        inputClickEvent: (storySpan) => {
            // storySpan點擊事件
            // 由於userInput變成disabled之後，點擊事件無法運作，所以將點擊事件加在storySpan上
            // 新增例句彈跳窗
            storySpan.addEventListener('click', e => {
                const target = e.target

                // 顯示使用者新增例句彈跳窗
                if(target.matches('#userInput') && target.getAttribute('disabled') == ''){
                    
                    const userText = target.value.trim()
                    const intent = target.nextElementSibling.children[0].innerText.slice(4, target.nextElementSibling.innerText.length)
                    console.log(intent)
                    getTextExam(userText, intent)
                }

                // 使用者新增例句彈跳窗彈跳窗產生function
                function getTextExam(userText, intent){
                    // 串接API - 抓取彈跳窗內所需資料
                    fetch(`http://192.168.10.127:3030/jh_story/userStep/nlu/getTextExams?text=${userText}&intent=${intent}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log(data)
                        localStorage.setItem('textExamData', JSON.stringify(data))
                        // 彈跳窗標題產生關鍵字
                        let examsTitleHtml = ''
                        data.forEach(item => {
                            if(item.text == userText && item.intent == intent){
                                // if(item.entities.length){
                                    examsTitleHtml = Method.story.createTextHtml(item, userText)
                                // }
                            }
                        })


                        let html = `
                        <div class="userBoxTitle">
                            <span class="userTextTitle" id="userTextTitle">${examsTitleHtml.text}</span>
                            <span id="intent-span" class="nluSpan"><i class="fas fa-tag" style="font-size: 7px;"></i><span id="intent-text" class="nluText">${intent}</span></span>
                        </div>
                        <div class="userTextExam" style="width:800px;">
                            <input type="text" class="form-control" name="userExamInput" id="userExamInput" placeholder="使用者說..." autocomplete="off">
                            <div id="textExams-panel">
                        `

                        const filterData = data.filter(item => item.text !== userText)
                        html = Method.story.createTextsFunc(filterData, html, examsTitleHtml)

                        html += `
                            </div>
                            <div class="textExams--footer">
                                <div id="errorMessageBox"></div>
                                <button id="sendExam" type="button" class="btn btn-info">送出</button>
                            </div>
                        </div>
                        `

                        Method.common.showBox(html,"userTextBox");

                        // 彈跳窗使用者添加例句功能
                        const userExamInput = document.querySelector('#userExamInput')
                        // 彈跳窗例句輸入框焦點事件
                        userExamInput.addEventListener('focus', e => {
                            const target = e.target
                            target.setAttribute('data-event', 'blur')
                        })

                        // 彈跳窗例句輸入框失焦事件
                        // userExamInput.addEventListener('blur', e => {
                        //     const target = e.target
                        //     const examText = target.value
                        //     if(target.dataset.event != 'blur' || !examText) return
                        //     // 串接後端API - 將使用者輸入的字句判斷意圖及關鍵字
                        //     fetch(`http://192.168.10.127:3030/jh_story/parse?userInput=${examText}`)
                        //     .then(response => response.json())
                        //     .then(inputParse => {
                        //         // 將回傳的判斷組成新的例句object
                        //         const newExam = {
                        //             text: inputParse.text,
                        //             intent: inputParse.intent.name,
                        //             entities: inputParse.entities,
                        //             metadata: {
                        //                 language: 'zh'
                        //             }
                        //         }
                        //         // 驗證是否重複
                        //         const repeatExam = data.filter(item => item.text == newExam.text)
                        //         if(!repeatExam.length){
                        //             data.push(newExam)
                        //             let newExamHtml = ''
                        //             newExamHtml = createTextsFunc(data, newExamHtml, examsTitleHtml)
                        //             document.querySelector('#textExams-panel').innerHTML = newExamHtml
                        //             eventFunc()
                        //             userExamInput.value = ''
                        //         }
                        //     })
                        //     .catch(err => console.log(err))
                        // })

                        // 彈跳窗例句輸入框按鍵事件
                        userExamInput.addEventListener('keydown', e => {
                            const target = e.target
                            const exampleTitle = Method.story.sliceText(document.querySelector('#userTextTitle').innerText)
                            const examText = target.value
                            localStorage.setItem('exampleTitle', exampleTitle)
                            if(e.keyCode == 13){
                                if(!examText) return
                                target.setAttribute('data-event', 'keydown')
                                fetch(`http://192.168.10.127:3030/jh_story/userStep/nlu/checkRepeat?userInput=${examText}`)
                                .then(res => res.json())
                                .then(info => {
                                    if(info.status !== 'success'){
                                        target.value = ''
                                        var html = `<h2><div class='sa-icon warning'><span></span></div>${info.message}</h2>`;
                                        Method.common.showBox(html, 'message', '')
                                        return
                                    }
                                    // 串接後端API - 將使用者輸入的字句判斷意圖及關鍵字
                                    fetch(`http://192.168.10.127:3030/jh_story/parse?userInput=${examText}`)
                                    .then(response => response.json())
                                    .then(inputParse => {
                                        // 將回傳的判斷組成新的例句object
                                        const newExam = {
                                            text: inputParse.text,
                                            intent: inputParse.intent.name,
                                            entities: inputParse.entities
                                        }
                                        // 驗證是否重複
                                        const textExamData = JSON.parse(localStorage.getItem('textExamData'))
                                        const repeatExam = textExamData.filter(item => item.text == newExam.text)
                                        if(repeatExam.length){
                                            target.value = ''
                                            var html = `<h2><div class='sa-icon warning'><span></span></div>例句重複</h2>`;
                                            Method.common.showBox(html, 'message', '')
                                            return
                                        }
                                        textExamData.push(newExam)
                                        localStorage.setItem('textExamData', JSON.stringify(textExamData))
                                        const exampleTitle = localStorage.getItem('exampleTitle')
                                        const newData = textExamData.filter(item => item.text !== exampleTitle)
                                        
                                        return newData
                                    })
                                    .then(newData => {
                                        let newExamHtml = ''
                                        newExamHtml = Method.story.createTextsFunc(newData, newExamHtml, examsTitleHtml)
                                        document.querySelector('#textExams-panel').innerHTML = newExamHtml
                                        Method.story.checkAllExampleIntent(newData)
                                        Method.story.eventFunc(newData, examsTitleHtml)
                                        userExamInput.value = ''
                                    })
                                    .catch(err => console.log(err))
                                })
                                .catch(err => console.log(err))
                            }
                        })

                        // 例句彈跳窗 送出按鈕事件
                        const sendExamBtn = document.querySelector('#sendExam')
                        sendExamBtn.addEventListener('click', e => {
                            const target = e.target
                            const textExamData = localStorage.getItem('textExamData')
                            const payload = {
                                textExamData
                            }
                            fetch('http://192.168.10.127:3030/jh_story/userStep/nlu/addExamples', {
                                method: 'post',
                                body: JSON.stringify(payload),
                                headers: {
                                    'Content-Type': "application/json",
                                }
                            })
                            .then(res => res.json())
                            .then(info => {
                                if(info.status === 'success'){
                                    document.querySelector('#userTextBox').remove()
                                }
                            })
                            .catch(err => console.log(err))
                        })

                        Method.story.eventFunc(data, examsTitleHtml)
                    })
                    .catch(err => console.log(err))
                }
            })
        },
        // 使用者步驟輸入框事件
        inputEvent: (input) => {
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
                            if(allStorySpan[i].children[0].dataset.status == 'typing'){
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

                        // 串接後端API 將資料傳送至rasa預測使用者輸入的意圖和關鍵字
                        fetch(`http://192.168.10.127:3030/jh_story/parse?userInput=${target.value}`)
                        .then(response => {
                            return response.json();
                        })
                        .then(data => {
                            const storyName = document.querySelector('#storyTitle').innerText
                            const payload = {
                                parse: data,
                                storyName,
                                indexNum
                            }
                            // 串接後端API新增故事流程
                            fetch(`http://192.168.10.127:3030/jh_story/userStep/fragments`,{
                                method: 'post',
                                body: JSON.stringify(payload),
                                headers: {
                                    'Content-Type': "application/json",
                                },
                            })
                            .then(response => response.json())
                            .then(info => {
                                if(info.status == 'success'){
                                    // 新增nlu
                                    const payload = {
                                        userParse: data
                                    }
                                    fetch(`http://192.168.10.127:3030/jh_story/userStep/nlu`,{
                                        method: 'post',
                                        body: JSON.stringify(payload),
                                        headers: {
                                            'Content-Type': "application/json",
                                        },
                                    })
                                    .then(response => response.json())
                                    .then(info => {
                                        if(info.status == 'warning'){
                                            const userStoryDiv = target.parentElement.parentElement
                                            var html = `<h2><div class='sa-icon warning'><span></span></div>${info.message}</h2>`;
                                            Method.common.showBox(html, 'message', '')
                                            const payload = {
                                                storyName,
                                                userSays: data.text,
                                                intent: data.intent.name
                                            }
                                            fetch(`http://192.168.10.127:3030/jh_story/userStep/fragments`,{
                                                method: 'delete',
                                                body: JSON.stringify(payload),
                                                headers: {
                                                    'Content-Type': "application/json",
                                                },
                                            })
                                            .then(response => response.json())
                                            .then(info => {
                                                if(info.status == 'success'){
                                                    userStoryDiv.remove()
                                                }
                                            })
                                            .catch(err => console.log(err))
                                            return
                                        }
                                        // 新增domain
                                        const payload = {
                                            userParse: data
                                        }
                                        fetch(`http://192.168.10.127:3030/jh_story/userStep/domain`,{
                                            method: 'post',
                                            body: JSON.stringify(payload),
                                            headers: {
                                                'Content-Type': "application/json",
                                            }
                                        })
                                        .catch(err => console.log(err))

                                        target.value = `${target.value}`;
                                        target.setAttribute('data-status', 'waiting')
                                        target.setAttribute('disabled', '');
                                        target.setAttribute('style', 'cursor: pointer;')
                                        Method.story.showNluSpan(data, allStorySpan, indexNum)
                                        // 將stepIndex放進intentSpan屬性中，讓查詢故事流程時，可以使用intentSpan點擊事件
                                        allStorySpan[indexNum].children[1].firstElementChild.dataset.stepindex = indexNum
                                    })
                                    .catch(err => console.log(err))
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
                        if(allStorySpan[i].children[0].dataset.status == 'typing'){
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
                        // 串接後端API 將資料傳送至rasa預測使用者輸入的意圖和關鍵字
                        fetch(`http://192.168.10.127:3030/jh_story/parse?userInput=${target.value}`)
                        .then(response => {
                            return response.json();
                        })
                        .then(data => {
                            const storyName = document.querySelector('#storyTitle').innerText
                            const payload = {
                                parse: data,
                                storyName,
                                indexNum
                            }
                            // 串接後端API新增故事流程
                            fetch(`http://192.168.10.127:3030/jh_story/userStep/fragments`,{
                                method: 'post',
                                body: JSON.stringify(payload),
                                headers: {
                                    'Content-Type': "application/json",
                                },
                            })
                            .then(response => response.json())
                            .then(info => {
                                if(info.status == 'success'){
                                    // 新增nlu
                                    const payload = {
                                        userParse: data
                                    }
                                    fetch(`http://192.168.10.127:3030/jh_story/userStep/nlu`,{
                                        method: 'post',
                                        body: JSON.stringify(payload),
                                        headers: {
                                            'Content-Type': "application/json",
                                        },
                                    })
                                    .then(response => response.json())
                                    .then(info => {
                                        if(info.status == 'warning'){
                                            const userStoryDiv = target.parentElement.parentElement
                                            var html = `<h2><div class='sa-icon warning'><span></span></div>${info.message}</h2>`;
                                            Method.common.showBox(html, 'message', '')
                                            const payload = {
                                                storyName,
                                                userSays: data.text,
                                                intent: data.intent.name
                                            }
                                            fetch(`http://192.168.10.127:3030/jh_story/userStep/fragments`,{
                                                method: 'delete',
                                                body: JSON.stringify(payload),
                                                headers: {
                                                    'Content-Type': "application/json",
                                                },
                                            })
                                            .then(response => response.json())
                                            .then(info => {
                                                if(info.status == 'success'){
                                                    userStoryDiv.remove()
                                                }
                                            })
                                            .catch(err => console.log(err))
                                            return
                                        }
                                        // 新增domain
                                        const payload = {
                                            userParse: data
                                        }
                                        fetch(`http://192.168.10.127:3030/jh_story/userStep/domain`,{
                                            method: 'post',
                                            body: JSON.stringify(payload),
                                            headers: {
                                                'Content-Type': "application/json",
                                            }
                                        })
                                        .catch(err => console.log(err))

                                        target.value = `${target.value}`;
                                        target.setAttribute('data-status', 'waiting')
                                        target.setAttribute('disabled', '');
                                        target.setAttribute('style', 'cursor: pointer;')
                                        Method.story.showNluSpan(data, allStorySpan, indexNum)
                                        // 將stepIndex放進intentSpan屬性中，讓查詢故事流程時，可以使用intentSpan點擊事件
                                        allStorySpan[indexNum].children[1].firstElementChild.dataset.stepindex = indexNum
                                    })
                                    .catch(err => console.log(err))
                                }
                            })
                            .catch(err => console.log(err))
                        })
                        .catch(err => console.log(err))
                    }
                })
        },
        simpleInputEvent: (input) => {
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
                        if(allStorySpan[i].children[0].dataset.status == 'typing'){
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

                    // 串接後端API 將資料傳送至rasa預測使用者輸入的意圖和關鍵字
                    fetch(`http://192.168.10.127:3030/jh_story/parse?userInput=${target.value}`)
                    .then(response => {
                        return response.json();
                    })
                    .then(data => {
                        const storyName = document.querySelector('#storyTitle').innerText
                        const payload = {
                            parse: data,
                            storyName,
                            indexNum
                        }
                        // 串接後端API新增故事流程
                        fetch(`http://192.168.10.127:3030/jh_simple_story/userStep/fragments`,{
                            method: 'post',
                            body: JSON.stringify(payload),
                            headers: {
                                'Content-Type': "application/json",
                            },
                        })
                        .then(response => response.json())
                        .then(info => {
                            if(info.status == 'success'){
                                // 新增nlu
                                const payload = {
                                    userParse: data
                                }
                                fetch(`http://192.168.10.127:3030/jh_simple_story/userStep/nlu`,{
                                    method: 'post',
                                    body: JSON.stringify(payload),
                                    headers: {
                                        'Content-Type': "application/json",
                                    },
                                })
                                .then(response => response.json())
                                .then(info => {
                                    if(info.status == 'warning'){
                                        const userStoryDiv = target.parentElement.parentElement
                                        var html = `<h2><div class='sa-icon warning'><span></span></div>${info.message}</h2>`;
                                        Method.common.showBox(html, 'message', '')
                                        const payload = {
                                            storyName,
                                            userSays: data.text,
                                            intent: data.text
                                        }
                                        fetch(`http://192.168.10.127:3030/jh_simple_story/userStep/fragments`,{
                                            method: 'delete',
                                            body: JSON.stringify(payload),
                                            headers: {
                                                'Content-Type': "application/json",
                                            },
                                        })
                                        .then(response => response.json())
                                        .then(info => {
                                            if(info.status == 'success'){
                                                userStoryDiv.remove()
                                            }
                                        })
                                        .catch(err => console.log(err))
                                        return
                                    }
                                    // 新增domain
                                    const payload = {
                                        userParse: data
                                    }
                                    fetch(`http://192.168.10.127:3030/jh_simple_story/userStep/domain`,{
                                        method: 'post',
                                        body: JSON.stringify(payload),
                                        headers: {
                                            'Content-Type': "application/json",
                                        }
                                    })
                                    .catch(err => console.log(err))

                                    target.value = `${target.value}`;
                                    target.setAttribute('data-status', 'waiting')
                                    target.setAttribute('disabled', '');
                                    target.setAttribute('style', 'cursor: pointer;')
                                    // Method.story.showNluSpan(data, allStorySpan, indexNum)
                                    // 將stepIndex放進intentSpan屬性中，讓查詢故事流程時，可以使用intentSpan點擊事件
                                    // allStorySpan[indexNum].children[1].firstElementChild.dataset.stepindex = indexNum
                                })
                                .catch(err => console.log(err))
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
                    if(allStorySpan[i].children[0].dataset.status == 'typing'){
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
                    // 串接後端API 將資料傳送至rasa預測使用者輸入的意圖和關鍵字
                    fetch(`http://192.168.10.127:3030/jh_story/parse?userInput=${target.value}`)
                    .then(response => {
                        return response.json();
                    })
                    .then(data => {
                        const storyName = document.querySelector('#storyTitle').innerText
                        const payload = {
                            parse: data,
                            storyName,
                            indexNum
                        }
                        // 串接後端API新增故事流程
                        fetch(`http://192.168.10.127:3030/jh_simple_story/userStep/fragments`,{
                            method: 'post',
                            body: JSON.stringify(payload),
                            headers: {
                                'Content-Type': "application/json",
                            },
                        })
                        .then(response => response.json())
                        .then(info => {
                            if(info.status == 'success'){
                                // 新增nlu
                                const payload = {
                                    userParse: data
                                }
                                fetch(`http://192.168.10.127:3030/jh_simple_story/userStep/nlu`,{
                                    method: 'post',
                                    body: JSON.stringify(payload),
                                    headers: {
                                        'Content-Type': "application/json",
                                    },
                                })
                                .then(response => response.json())
                                .then(info => {
                                    if(info.status == 'warning'){
                                        const userStoryDiv = target.parentElement.parentElement
                                        var html = `<h2><div class='sa-icon warning'><span></span></div>${info.message}</h2>`;
                                        Method.common.showBox(html, 'message', '')
                                        const payload = {
                                            storyName,
                                            userSays: data.text,
                                            intent: data.text
                                        }
                                        fetch(`http://192.168.10.127:3030/jh_simple_story/userStep/fragments`,{
                                            method: 'delete',
                                            body: JSON.stringify(payload),
                                            headers: {
                                                'Content-Type': "application/json",
                                            },
                                        })
                                        .then(response => response.json())
                                        .then(info => {
                                            if(info.status == 'success'){
                                                userStoryDiv.remove()
                                            }
                                        })
                                        .catch(err => console.log(err))
                                        return
                                    }
                                    // 新增domain
                                    const payload = {
                                        userParse: data
                                    }
                                    fetch(`http://192.168.10.127:3030/jh_simple_story/userStep/domain`,{
                                        method: 'post',
                                        body: JSON.stringify(payload),
                                        headers: {
                                            'Content-Type': "application/json",
                                        }
                                    })
                                    .catch(err => console.log(err))

                                    target.value = `${target.value}`;
                                    target.setAttribute('data-status', 'waiting')
                                    target.setAttribute('disabled', '');
                                    target.setAttribute('style', 'cursor: pointer;')
                                    // Method.story.showNluSpan(data, allStorySpan, indexNum)
                                    // 將stepIndex放進intentSpan屬性中，讓查詢故事流程時，可以使用intentSpan點擊事件
                                    // allStorySpan[indexNum].children[1].firstElementChild.dataset.stepindex = indexNum
                                })
                                .catch(err => console.log(err))
                            }
                        })
                        .catch(err => console.log(err))
                    })
                    .catch(err => console.log(err))
                }
            })
        },
        simpleInputClickEvent: (storySpan) => {
            // storySpan點擊事件
            // 由於userInput變成disabled之後，點擊事件無法運作，所以將點擊事件加在storySpan上
            // 新增例句彈跳窗
            storySpan.addEventListener('click', e => {
                const target = e.target

                // 顯示使用者新增例句彈跳窗
                if(target.matches('#userInput') && target.getAttribute('disabled') == ''){
                    
                    const userText = target.value.trim()
                    const intent = target.value.trim()
                    getTextExam(userText, intent)
                }

                // 使用者新增例句彈跳窗彈跳窗產生function
                function getTextExam(userText, intent){
                    // 串接API - 抓取彈跳窗內所需資料
                    fetch(`http://192.168.10.127:3030/jh_simple_story/userStep/nlu/getTextExams?text=${userText}&intent=${intent}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log(data)
                        localStorage.setItem('textExamData', JSON.stringify(data))
                        // 彈跳窗標題產生關鍵字
                        let examsTitleHtml = ''
                        data.forEach(item => {
                            if(item.text == userText && item.intent == intent){
                                // if(item.entities.length){
                                    examsTitleHtml = Method.story.createTextHtml(item, userText)
                                // }
                            }
                        })


                        let html = `
                        <div class="userBoxTitle">
                            <span class="userTextTitle" id="userTextTitle">${examsTitleHtml.text}</span>
                        </div>
                        <div class="userTextExam" style="width:800px;">
                            <input type="text" class="form-control" name="userExamInput" id="userExamInput" placeholder="使用者說..." autocomplete="off">
                            <div id="textExams-panel">
                        `

                        const filterData = data.filter(item => item.text !== userText)
                        html = Method.story.createTextsFunc(filterData, html, examsTitleHtml)

                        html += `
                            </div>
                            <div class="textExams--footer">
                                <div id="errorMessageBox"></div>
                                <button id="sendExam" type="button" class="btn btn-info">送出</button>
                            </div>
                        </div>
                        `

                        Method.common.showBox(html,"userTextBox");

                        // 彈跳窗使用者添加例句功能
                        const userExamInput = document.querySelector('#userExamInput')
                        // 彈跳窗例句輸入框焦點事件
                        userExamInput.addEventListener('focus', e => {
                            const target = e.target
                            target.setAttribute('data-event', 'blur')
                        })

                        // 彈跳窗例句輸入框按鍵事件
                        userExamInput.addEventListener('keydown', e => {
                            const target = e.target
                            const exampleTitle = Method.story.sliceText(document.querySelector('#userTextTitle').innerText)
                            const examText = target.value
                            localStorage.setItem('exampleTitle', exampleTitle)
                            if(e.keyCode == 13){
                                if(!examText) return
                                target.setAttribute('data-event', 'keydown')
                                fetch(`http://192.168.10.127:3030/jh_story/userStep/nlu/checkRepeat?userInput=${examText}`)
                                .then(res => res.json())
                                .then(info => {
                                    if(info.status !== 'success'){
                                        target.value = ''
                                        var html = `<h2><div class='sa-icon warning'><span></span></div>${info.message}</h2>`;
                                        Method.common.showBox(html, 'message', '')
                                        return
                                    }
                                    // 串接後端API - 將使用者輸入的字句判斷意圖及關鍵字
                                    fetch(`http://192.168.10.127:3030/jh_story/parse?userInput=${examText}`)
                                    .then(response => response.json())
                                    .then(inputParse => {
                                        // 將回傳的判斷組成新的例句object
                                        const newExam = {
                                            text: inputParse.text,
                                            intent,
                                            entities: inputParse.entities
                                        }
                                        // 驗證是否重複
                                        const textExamData = JSON.parse(localStorage.getItem('textExamData'))
                                        const repeatExam = textExamData.filter(item => item.text == newExam.text)
                                        if(repeatExam.length){
                                            target.value = ''
                                            var html = `<h2><div class='sa-icon warning'><span></span></div>例句重複</h2>`;
                                            Method.common.showBox(html, 'message', '')
                                            return
                                        }
                                        textExamData.push(newExam)
                                        localStorage.setItem('textExamData', JSON.stringify(textExamData))
                                        const exampleTitle = localStorage.getItem('exampleTitle')
                                        const newData = textExamData.filter(item => item.text !== exampleTitle)
                                        return newData
                                    })
                                    .then(newData => {
                                        let newExamHtml = ''
                                        newExamHtml = Method.story.createTextsFunc(newData, newExamHtml, examsTitleHtml)
                                        document.querySelector('#textExams-panel').innerHTML = newExamHtml
                                        // Method.story.checkAllExampleIntent(newData)
                                        Method.story.eventFunc(newData, examsTitleHtml)
                                        userExamInput.value = ''
                                    })
                                    .catch(err => console.log(err))
                                })
                                .catch(err => console.log(err))
                            }
                        })

                        // 例句彈跳窗 送出按鈕事件
                        const sendExamBtn = document.querySelector('#sendExam')
                        sendExamBtn.addEventListener('click', e => {
                            const target = e.target
                            const textExamData = localStorage.getItem('textExamData')
                            const payload = {
                                textExamData
                            }
                            fetch('http://192.168.10.127:3030/jh_simple_story/userStep/nlu/addExamples', {
                                method: 'post',
                                body: JSON.stringify(payload),
                                headers: {
                                    'Content-Type': "application/json",
                                }
                            })
                            .then(res => res.json())
                            .then(info => {
                                if(info.status === 'success'){
                                    document.querySelector('#userTextBox').remove()
                                }
                            })
                            .catch(err => console.log(err))
                        })

                        Method.story.eventFunc(data, examsTitleHtml)
                    })
                    .catch(err => console.log(err))
                }
            })
        },
        simpleClickRemoveBtnEvent: (removeBtn) => {
            // 刪除按鈕點擊事件
            removeBtn.addEventListener('click', e => {
                // storyName - 該頁面故事流程名稱
                const target = e.target;
                const storyName = document.querySelector('#storyTitle').innerText
        
                // userStoryDiv - 該點擊目標的故事流程步驟外框，用來刪除故事流程步驟用
                // text - 該點擊目標故事流程步驟，使用者輸入的文字
                // intent - 該點擊目標故事流程步驟，使用者的意圖，使用slice()是因為顯示文字時，在前方加上「意圖: 」，所以取意圖需要去除前4個字
                if(target.matches('#removeBtn')){
                    const userStoryDiv = target.parentElement.parentElement.parentElement
                    if(target.parentElement.parentElement.previousElementSibling.children[0].id == 'userInput'){
                        if(target.parentElement.parentElement.previousElementSibling.children[0].value){
                            const text = target.parentElement.parentElement.previousElementSibling.children[0].value
                            const intent = text
                            removeUserStep(storyName, text, intent, userStoryDiv)
                        }else{
                            userStoryDiv.remove()
                        }
                    }
                }
        
                if(target.tagName == 'svg'){
                    const userStoryDiv = target.parentElement.parentElement.parentElement.parentElement
                    if(target.parentElement.parentElement.parentElement.previousElementSibling.children[0].id == 'userInput'){
                        if(target.parentElement.parentElement.parentElement.previousElementSibling.children[0].value){
                            const text = target.parentElement.parentElement.parentElement.previousElementSibling.children[0].value
                            const intent = text
                            removeUserStep(storyName, text, intent, userStoryDiv)
                        }else{
                            userStoryDiv.remove()
                        }
                    }
                }
        
                if(target.tagName == 'path'){
                    const userStoryDiv = target.parentElement.parentElement.parentElement.parentElement.parentElement
                    if(target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[0].id == 'userInput'){
                        if(target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[0].value){
                            const text = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[0].value
                            const intent = text
                            intent = intent.slice(4, intent.length)
                            removeUserStep(storyName, text, intent, userStoryDiv)
                        }else{
                            userStoryDiv.remove()
                        }
                    }
                }
        
                // 移除故事流程function
                function removeUserStep(storyName, userSays, intent, userStoryDiv){
                    const payload = {
                        storyName,
                        userSays,
                        intent
                    }
                    fetch(`http://192.168.10.127:3030/jh_story/userStep/fragments`,{
                        method: 'delete',
                        body: JSON.stringify(payload),
                        headers: {
                            'Content-Type': "application/json",
                        },
                    })
                    .then(response => response.json())
                    .then(info => {
                        if(info.status == 'success'){
                            userStoryDiv.remove()
                        }
                    })
                    .catch(err => console.log(err))
        
                    fetch(`http://192.168.10.127:3030/jh_story/userStep/nlu/example`,{
                        method: 'delete',
                        body: JSON.stringify(payload),
                        headers: {
                            'Content-Type': "application/json",
                        },
                    })
                    .catch(err => console.log(err))
                }
            })
        }
    },
    // 機器人步驟共用function
    botStep: {
        // 所有機器人步驟事件
        allBotStepEvent: (removeBtn, bottomRightDiv, resNameInput, textArea) => {
            Method.story.botStep.removeBtnClickEvent(removeBtn)
            Method.story.botStep.resNameDivMouseEvent(bottomRightDiv)
            Method.story.botStep.resNameInputEvent(resNameInput)
            Method.story.botStep.resNameRandom(resNameInput)
            Method.story.botStep.resTextAreaEvent(textArea)
        },
        // 機器人步驟刪除按鈕事件
        removeBtnClickEvent: (removeBtn) => {
            // 刪除按鈕點擊事件
            removeBtn.addEventListener('click', e => {
                const target = e.target;
                const storyName = document.querySelector('#storyTitle').innerText
                let resCode
                let botStoryDiv
                let response
    
    
                if(target.matches('#removeBtn')){
                    botStoryDiv =target.parentElement.parentElement.parentElement
                    resCode = target.parentElement.parentElement.nextElementSibling.children[0].children[0].children[0].value
                    response = target.parentElement.parentElement.previousElementSibling.firstElementChild.value
                }
    
                if(target.tagName == 'svg'){
                    botStoryDiv = target.parentElement.parentElement.parentElement.parentElement
                    resCode = target.parentElement.parentElement.parentElement.nextElementSibling.children[0].children[0].children[0].value
                    response = target.parentElement.parentElement.parentElement.previousElementSibling.firstElementChild.value
                }
    
                if(target.tagName == 'path'){
                    botStoryDiv = target.parentElement.parentElement.parentElement.parentElement.parentElement
                    resCode = target.parentElement.parentElement.parentElement.parentElement.nextElementSibling.children[0].children[0].children[0].value
                    response = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.firstElementChild.value
                }
    
                if(!response){
                    botStoryDiv.remove()
                    return
                }
    
                const payload = {
                    storyName,
                    resCode
                }
                // 串接後端API 刪除故事流程中的機器人回覆步驟
                fetch('http://192.168.10.127:3030/jh_story/botStep/fragments', {
                    method: 'delete',
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': "application/json",
                    }
                })
                .then(res => res.json())
                .then(info => {
                    if(info.status === 'success'){
                        const payload = {
                            resCode
                        }
                        // 串接後端API 刪除在domain中註冊的機器人回覆
                        fetch('http://192.168.10.127:3030/jh_story/botStep/domain', {
                            method: 'delete',
                            body: JSON.stringify(payload),
                            headers: {
                                'Content-Type': "application/json",
                            }
                        })
                        .then(res => res.json())
                        .then(info => {
                            if(info.status === 'success'){
                                botStoryDiv.remove()
                            }
                        })
                        .catch(err => console.log(err))
                    }
                })
                .catch(err => console.log(err))
            })
        },
        // 機器人回覆名稱滑鼠事件(動態顯示機器人代號輸入框的外框)
        resNameDivMouseEvent: (bottomRightDiv) => {
            // 動態顯示外框
            bottomRightDiv.addEventListener('mousemove', e => {
                const target = e.target;
                if(target.matches('#res-name-input')){
                    target.style.border = '1px solid #ccc';
                }
            })
    
            // 動態隱藏外框
            bottomRightDiv.addEventListener('mouseleave', e => {
                const target = e.target;
                // 如果輸入框foucs就繼續顯示外框
                if(target.dataset.isfocus == 'false'){
                    target.children[0].children[0].children[0].style.border = 'none';
                }
            })
        },
        // 機器人回覆名稱輸入框事件
        resNameInputEvent: (resNameInput) => {
            // 輸入框焦點事件
            resNameInput.addEventListener('focus', e => {
                const target = e.target;
                target.parentElement.parentElement.parentElement.dataset.isfocus = 'true';
            })
    
            // 輸入框失焦事件
            resNameInput.addEventListener('blur', e => {
                const target = e.target;
                target.parentElement.parentElement.parentElement.dataset.isfocus = 'false';
                if(bottomRightDiv.dataset.ismouseleave == 'true'){
                    target.parentElement.parentElement.parentElement.style.visibility = 'hidden';
                }else{
                    target.style.border = 'none';
                }
                
            })

            // 輸入框enter事件
            resNameInput.addEventListener('keyup', e => {
                const target = e.target
                if(e.keyCode === 13){
                    console.log(target.value)
                }
            })
        },
        // 隨機產生機器人回覆名稱
        resNameRandom: (resNameInput) => {
            fetch(`http://192.168.10.127:3030/jh_story/domain/getResponses`)
            .then(res => res.json())
            .then(responses => {
                
                let resCode = Method.story.randomBotResName()

                const responsesKeyArr = []

                for(let key in responses){
                    responsesKeyArr.push(key)
                }

                while(responsesKeyArr.indexOf(resCode) > -1){
                    resCode = Method.story.randomBotResName()
                }

                resNameInput.value = resCode
            })
            .catch(err => console.log(err))
        },
        // 機器人回覆輸入框事件
        resTextAreaEvent: (textArea) => {
            // 機器人回覆輸入框焦點事件
            textArea.addEventListener('focus', e => {
                const target = e.target
                if(!target.readOnly){
                    target.setAttribute('data-event', 'blur')
                    target.setAttribute('data-status', 'typing')
                }
            })

            // 機器人回覆輸入框輸入事件 - 自適應調整高度
            textArea.addEventListener('input', e => {
                textArea.style.height = '100px';
                textArea.style.height = e.target.scrollHeight + 'px';
            })

            /* 機器人回覆輸入框enter 事件
            // textArea.addEventListener('keyup', e => {
            //     const target = e.target
            //     if(e.keyCode === 13){

            //         if(!target.value) return

            //         // 獲取陣列位置
            //         let indexNum = 0
            //         const allStorySpan = document.querySelectorAll('#storySpan')
            //         for(i = 0; i < allStorySpan.length; i++){
            //             if(allStorySpan[i].childNodes[0].dataset.status == 'typing'){
            //                 indexNum = i
            //             }
            //         }

            //         // 沒有設定故事名稱就返回
            //         target.setAttribute('data-event', 'keydown')
            //         if(document.querySelector('#storyTitle').innerText == '未命名故事'){
            //             target.setAttribute('data-status', 'waiting')
            //             target.value = ''
            //             var html = "<h2><div class='sa-icon warning'><span></span></div>請先設定故事名稱</h2>";
            //             Method.common.showBox(html, 'message', '')
            //             return
            //         }

            //         // 抓取故事名稱和回覆代號
            //         const storyName = document.querySelector('#storyTitle').innerText
            //         const resCode = target.parentElement.parentElement.lastChild.children[0].children[0].children[0].value

            //         // 串接API 新增故事流程 fragments
            //         const payload = {
            //             storyName,
            //             resCode,
            //             indexNum
            //         }
            //         fetch(`http://192.168.10.127:3030/jh_story/botStep/fragments`,{
            //             method: 'post',
            //             body: JSON.stringify(payload),
            //             headers: {
            //                 'Content-Type': "application/json",
            //             },
            //         })
            //         .then(response => response.json())
            //         .then(info => {
            //             if(info.status === 'success'){
            //                 // 串接API 註冊機器人回覆 domain
            //                 const payload = {
            //                     resCode,
            //                     botReply: target.value
            //                 }
            //                 fetch(`http://192.168.10.127:3030/jh_story/botStep/domain`, {
            //                     method: 'post',
            //                     body: JSON.stringify(payload),
            //                     headers: {
            //                         'Content-Type': "application/json",
            //                     },
            //                 })
            //                 .then(res => res.json())
            //                 .then(info => {
            //                     if(info.status === 'success'){
            //                         target.setAttribute('data-status', 'waiting')
            //                         target.setAttribute('disabled', '')
            //                     }
            //                 })
            //                 .catch(err => console.log(err))
            //             }
            //         })
            //         .catch(err => console.log(err))
            //     }
            // })
        */

            // 機器人回覆輸入框失焦 事件
            textArea.addEventListener('blur', e => {
                const target = e.target;

                // 獲取輸入框在陣列中的位置
                let indexNum = 0
                const allStorySpan = document.querySelectorAll('#storySpan')
                for(i = 0; i < allStorySpan.length; i++){
                    if(allStorySpan[i].children[0].dataset.status == 'typing'){
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
                    // 抓取故事名稱和回覆代號
                    const storyName = document.querySelector('#storyTitle').innerText
                    const resCode = target.parentElement.parentElement.lastElementChild.children[0].children[0].children[0].value

                    // 檢查resCode是否有重複，如果有重複代表是要編輯
                    // 因為新建resCode的時候，已經確認過重複，所以如果是新增，一定不會有重複的resCode
                    fetch(`http://192.168.10.127:3030/jh_story/domain/getResponses`)
                    .then(res => res.json())
                    .then(responses => {
                        // 將responses的key取出，resCode寫進訓練檔就是responses的key
                        const responsesKeyArr = []
                        for(let key in responses){
                            responsesKeyArr.push(key)
                        }

                        // 比對此action是否已存在
                        // 存在代表是要更新回覆
                        // 不存在代表是要新增
                        if(responsesKeyArr.indexOf(resCode) > -1){
                            // 更新
                            // 如果回覆的字句一樣，代表沒更改，將textarea狀態設回readO設回readonly即可
                            if(responses[resCode][0].text === target.value){
                                target.setAttribute('data-status', 'waiting')
                                target.readOnly = true
                                return
                            }

                            // 回覆字句不一樣，代表要更新
                            // 串接後端API 更新訓練檔的機器人回覆
                            const payload = {
                                resCode,
                                botReply: target.value
                            }
                            fetch(`http://192.168.10.127:3030/jh_story/botStep/domain`, {
                                method: 'put',
                                body: JSON.stringify(payload),
                                headers: {
                                    'Content-Type': "application/json",
                                }
                            })
                            .then(res => res.json())
                            .then(info => {
                                if(info.status === 'success'){
                                    target.setAttribute('data-status', 'waiting')
                                    target.readOnly = true
                                }
                            })
                            .catch(err => console.log(err))
                        }else{
                            // 新增
                            // 串接API 新增故事流程 fragments
                            const payload = {
                                storyName,
                                resCode,
                                indexNum
                            }
                            fetch(`http://192.168.10.127:3030/jh_story/botStep/fragments`,{
                                method: 'post',
                                body: JSON.stringify(payload),
                                headers: {
                                    'Content-Type': "application/json",
                                },
                            })
                            .then(response => response.json())
                            .then(info => {
                                if(info.status === 'success'){
                                    // 串接API 註冊機器人回覆 domain
                                    const payload = {
                                        resCode,
                                        botReply: target.value
                                    }
                                    fetch(`http://192.168.10.127:3030/jh_story/botStep/domain`, {
                                        method: 'post',
                                        body: JSON.stringify(payload),
                                        headers: {
                                            'Content-Type': "application/json",
                                        },
                                    })
                                    .then(res => res.json())
                                    .then(info => {
                                        if(info.status === 'success'){
                                            target.setAttribute('data-status', 'waiting')
                                            target.readOnly = true
                                        }
                                    })
                                    .catch(err => console.log(err))
                                }
                            })
                            .catch(err => console.log(err))
                        }
                    })
                }
            })

            // 機器人回覆輸入框點擊事件(更改readonly)
            textArea.addEventListener('click', e => {
                const target = e.target
                if(target.readOnly && target.dataset.status === 'waiting'){
                    target.readOnly = false
                }
            })
        }
    },
    // 動態顯示故事流程事件
    showBorder: (stories, btnDiv, userBtn, botBtn) => {
        // 動態顯示
        stories.addEventListener('mousemove', e => {
            btnDiv.style.opacity = '1';
            btnDiv.style.transition = 'opacity .1s ease-in-out';

            if(document.querySelectorAll('#storyDiv').length){
                const allStoryDiv = document.querySelectorAll('#storyDiv');
                const allTopRightDiv = document.querySelectorAll('.top-right');
                const allBottomRightDiv = document.querySelectorAll('.bottom-right');
                const allResNameInput = document.querySelectorAll('#res-name-input');
                const allIntentBtn = document.querySelectorAll('#intentBtn');

                // 動態顯示故事流程步驟外框
                Array.from(allStoryDiv).map(storyDiv => storyDiv.style.border = '1px solid #ccc');

                // 動態顯示故事流程步驟操作按鈕框(添加意圖、刪除按鈕)
                Array.from(allTopRightDiv).map(topRightDiv => topRightDiv.style.visibility = 'visible');

                // 動態顯示機器人對話名稱
                Array.from(allBottomRightDiv).map(bottomRightDiv => {
                    bottomRightDiv.style.visibility = 'visible';
                    bottomRightDiv.setAttribute('data-ismouseleave', 'false');
                })

                // 動態顯示意圖按鈕
                Array.from(allIntentBtn).map(intentBtn => {
                    const attrSpan = intentBtn.parentElement.parentElement.previousElementSibling.lastElementChild
                    const hasIntent = []

                    // 如果使用者有輸入文字，就一定會有意圖
                    // 將意圖加入判斷陣列中
                    if(attrSpan.children.length){
                        hasIntent.push(attrSpan.children[0])
                    }

                    if(hasIntent.length){
                        intentBtn.style.visibility = 'hidden'
                    }else{
                        intentBtn.style.visibility = 'visible'
                    }
                })
            }

            // 動態顯示使用者按鈕
            if(stories.children.length > 1){
                if(stories.lastElementChild.previousElementSibling.className == 'userStep'){
                    if(document.querySelector('#userBtn')){
                        userBtn.style.display = 'none';
                        botBtn.style.marginLeft = '0';
                    }
                }else{
                    userBtn.style.display = 'inline-block';
                    botBtn.style.marginLeft = '12px';
                }
            }else{
                userBtn.style.display = 'inline-block';
                botBtn.style.marginLeft = '12px';
            }
        })

        // 動態隱藏
        stories.addEventListener('mouseleave', e => {
            btnDiv.style.opacity = '0';
            btnDiv.style.transition = 'opacity .1s ease-in-out';

            if(document.querySelectorAll('#storyDiv').length){
                const allStoryDiv = document.querySelectorAll('#storyDiv');
                const allTopRightDiv = document.querySelectorAll('.top-right');
                const allBottomRightDiv = document.querySelectorAll('.bottom-right');
                const allResNameInput = document.querySelectorAll('#res-name-input');
                const allIntentBtn = document.querySelectorAll('#intentBtn')

                // 動態隱藏故事流程外框
                Array.from(allStoryDiv).map(storyDiv => storyDiv.style.border = '1px solid transparent')

                // 動態隱藏故事流程步驟操作按鈕框(添加意圖、刪除按鈕)
                Array.from(allTopRightDiv).map(topRightDiv => topRightDiv.style.visibility = 'hidden')

                // 動態隱藏意圖按鈕
                Array.from(allIntentBtn).map(intentBtn => intentBtn.style.visibility = 'hidden')
                
                // 動態隱藏機器人對話名稱
                if(allBottomRightDiv.length){
                    Array.from(allBottomRightDiv).map(bottomRightDiv => {
                        bottomRightDiv.setAttribute('data-ismouseleave', 'true');
                        if(bottomRightDiv.dataset.isfocus == 'false'){
                            bottomRightDiv.style.visibility = 'hidden';
                        }
                    })
                }
            }
        })
    },
    // 查詢故事流程的刪除故事按鈕事件
    clickStoryRemoveBtnEvent: (storyRemoveBtn) => {
        storyRemoveBtn.addEventListener('click', e => {
            const target = e.target
            const storyName = target.dataset.storyname
            const payload = {
                storyName
            }
            fetch(`http://192.168.10.127:3030/jh_story/fragments`,{
                method: 'delete',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': "application/json",
                },
            })
            .then(res => res.json())
            .then(info => {
                if(info.status === 'success'){
                    // 將故事流程畫面清空
                    document.querySelector('#stories').innerHTML = ``

                    // 將stories的故事名稱拿出
                    const storyArr = []
                    info.data.stories.map(item => storyArr.push(item.story))

                    // 將故事名稱做成選項
                    let html = `
                        <option value="" selected>請選擇</option>
                    `

                    storyArr.map(story => {
                        html += `
                            <option value="${story}" selected>${story}</option>
                        `
                    })

                    // 更新select的選項
                    document.querySelector('#storyFilter').innerHTML = html
                }
            })
            .catch(err => console.log(err))
        })
    },
    // 點擊使用者按鈕
    clickUserBtn: () => {
        const stories = document.querySelector('#stories');
        const storyDiv = document.createElement('div');
        storyDiv.setAttribute('id', 'storyDiv');
        storyDiv.setAttribute('class', 'userStep');
        storyDiv.setAttribute('style', 'border: 1px solid transparent;border-radius: 5px')

        const storySpan = document.createElement('span');
        storySpan.setAttribute('id', 'storySpan');
        const attrSpan = document.createElement('span')
        attrSpan.setAttribute('id', 'attrSpan')

        const input = document.createElement('input');
        input.setAttribute('placeholder', '使用者說....');
        input.setAttribute('name', 'userInput');
        input.setAttribute('id', 'userInput');
        input.setAttribute('class', 'form-control story-user');
        input.setAttribute('data-event', 'blur')
        input.setAttribute('data-status', 'waiting')
        input.setAttribute('autocomplete', 'off')

        const removeBtn = document.createElement('button');
        removeBtn.setAttribute('type', 'button');
        removeBtn.setAttribute('id', 'removeBtn');
        removeBtn.setAttribute('class', 'btn btn-danger');
        removeBtn.setAttribute('style', 'margin-left: 5px;');

        const removeIcon = document.createElement('i');
        removeIcon.setAttribute('class', 'fas fa-trash-alt');
        removeIcon.setAttribute('style', 'font-size: 7px;');
        removeBtn.appendChild(removeIcon);

        

        const btnSpan = document.createElement('span');

        if(document.querySelector('.jh_story') || document.querySelector('.jh_new_story')){
            const intentBtn = document.createElement('button');
            intentBtn.setAttribute('type', 'button');
            intentBtn.setAttribute('id', 'intentBtn');
            intentBtn.setAttribute('class', 'btn btn-warning');

            const intentIcon = document.createElement('i');
            intentIcon.setAttribute('class', 'fas fa-tag');
            intentIcon.setAttribute('style', 'font-size: 7px;');
            intentBtn.appendChild(intentIcon);

            btnSpan.appendChild(intentBtn);
        }
        btnSpan.appendChild(removeBtn);

        const topRightDiv = document.createElement('div');
        topRightDiv.setAttribute('class', 'top-right');
        topRightDiv.setAttribute('style', 'max-width: 100px;position: absolute;top: 9px;right: 9px;visibility: hidden;');
        topRightDiv.appendChild(btnSpan);

        storySpan.appendChild(input);
        storySpan.appendChild(attrSpan)
        storyDiv.appendChild(storySpan);
        storyDiv.appendChild(topRightDiv);
        stories.insertBefore(storyDiv, stories.lastElementChild);

        if(document.querySelector('.jh_story') || document.querySelector('.jh_new_story')){
            Method.story.userStep.allUserStepEvent(removeBtn, intentBtn, storySpan, input)
        }else{
            Method.story.userStep.allUserStepEvent(removeBtn, null, storySpan, input)
        }
    },
    // 點擊機器人按鈕
    clickBotBtn: () => {
        const stories = document.querySelector('#stories');
        const storyDiv = document.createElement('div');
        storyDiv.setAttribute('id', 'storyDiv');
        storyDiv.setAttribute('class', 'botRes');
        storyDiv.setAttribute('style', 'margin-left: 20%;border: 1px solid transparent;border-radius: 5px')

        const storySpan = document.createElement('span');
        storySpan.setAttribute('id', 'storySpan');

        const textArea = document.createElement('textArea');
        textArea.setAttribute('placeholder', '機器人回覆....');
        textArea.setAttribute('name', 'botInput');
        textArea.setAttribute('id', 'botInput');
        textArea.setAttribute('class', 'form-control story-bot');
        textArea.setAttribute('data-status', 'waiting')

        const removeBtn = document.createElement('button');
        removeBtn.setAttribute('type', 'button');
        removeBtn.setAttribute('id', 'removeBtn');
        removeBtn.setAttribute('class', 'btn btn-danger');

        const removeIcon = document.createElement('i');
        removeIcon.setAttribute('class', 'fas fa-trash-alt');
        removeIcon.setAttribute('style', 'font-size: 7px;')
        removeBtn.appendChild(removeIcon);

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

        storySpan.appendChild(textArea);
        storyDiv.appendChild(storySpan);
        storyDiv.appendChild(topRightDiv);
        storyDiv.appendChild(bottomRightDiv);
        stories.insertBefore(storyDiv, stories.lastElementChild);

        Method.story.botStep.allBotStepEvent(removeBtn, bottomRightDiv, resNameInput, textArea)
    },
    // 點擊意圖按鈕
    clickIntentBtn: (storyContainer, targetInput, allStorySpan, indexNum) => {
        if(document.querySelector('#storyTitle').innerText == '未命名故事'){
            var html = "<h2><div class='sa-icon warning'><span></span></div>請先設定故事名稱</h2>";
            Method.common.showBox(html, 'message', '')
            return
        }
        const prop = prompt(`請輸入意圖`, '');
        if(prop != '' && prop != null){
            const storyName = document.querySelector('#storyTitle').innerText
            const payload = {
                intent: prop,
                storyName,
                indexNum
            }
            // 串接後端API 新增故事流程
            fetch(`http://192.168.10.127:3030/jh_story/userStep/fragments/onlyIntent`, {
                method: 'post',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': "application/json",
                },
            })
            .then(response => response.json())
            .then(info => {
                if(info.status == 'success'){
                    const userParse = {
                        intent:{
                            name: prop
                        },
                        entities: []
                    }
    
                    const payload = {
                        userParse
                    }
                    // 串接後端API 新增意圖清單
                    fetch(`http://192.168.10.127:3030/jh_story/userStep/domain`, {
                        method: 'post',
                        body: JSON.stringify(payload),
                        headers: {
                            'Content-Type': "application/json",
                        },
                    })
                    .then(res => res.json())
                    .then(info => {
                        if(info.status == 'success'){
                            Method.story.showIntent(prop, allStorySpan, indexNum)
                            storyContainer.children[0].setAttribute('data-status', 'waiting')
                            targetInput.nextElementSibling.children[0].classList.toggle('mt-10')
                            targetInput.remove()
                        }
                    })
                    .catch(err => console.log(err))
                }else{
                    const html = "<h2><div class='sa-icon error'><span></span></div>系統錯誤</h2>";
                    Method.common.showBox(html, 'message', '');
                }
            })
            .catch(err => console.log(err))
        }else{
            if(prop != null){
                const html = "<h2><div class='sa-icon warning'><span></span></div>意圖不能為空白</h2>";
                Method.common.showBox(html, 'message', '');
            }
        }
    },
    // 機器人回覆名稱產生器
    randomBotResName: () => {
        const lower = 'abcdefghijklmnopqrstuvwxyz'
        const upper = lower.toUpperCase()
        const num = '1234567890'
        const randomText = lower + upper + num
        let text = 'utter_'
        for(i = 0; i < 9; i++){
            text += randomText[Math.floor(Math.random() * randomText.length)]
        }
        return text
    },
    // 建立並顯示意圖和關鍵字
    showNluSpan: (data, allStorySpan, indexNum) => {
        let intentName = ''
        if(data.intent.name){
            intentName = data.intent.name
        }else{
            intentName = data.intent
        }
        Method.story.showIntent(intentName, allStorySpan, indexNum)
    
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
            allStorySpan[indexNum].children[1].appendChild(entitiesSpan)
        })
    },
    // 建立並顯示意圖
    showIntent: (intentName, allStorySpan, indexNum) => {
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
        allStorySpan[indexNum].children[1].appendChild(intentSpan)
        // 意圖點擊事件
        Method.story.clickIntentSpanEvent(intentSpan, indexNum)
    },
    // 意圖點擊事件
    clickIntentSpanEvent: (intentSpan, indexNum) => {
        // 意圖點擊事件
        intentSpan.addEventListener('click', e => {
            const target = e.target
            let examText = ``
            let intent = ``
            let stepIndex = indexNum

            // 抓取使用者例句及意圖
            if(target.matches('#intent-span')){
                examText = target.parentElement.previousElementSibling.value
                intent = target.lastElementChild.innerText.slice(4, target.lastElementChild.innerText.length)
                if(!stepIndex && stepIndex !== 0){
                    stepIndex = target.dataset.stepindex
                }
            }else if(target.matches('#intent-text') || target.tagName == 'svg'){
                examText = target.parentElement.parentElement.previousElementSibling.value
                intent = target.innerText.slice(4, target.innerText.length)
                if(!stepIndex && stepIndex !== 0){
                    stepIndex = target.parentElement.dataset.stepindex
                }
                if(target.tagName == 'svg'){
                    intent = target.nextElementSibling.innerText.slice(4, target.nextElementSibling.innerText.length)
                }
            }else{
                examText = target.parentElement.parentElement.parentElement.previousElementSibling.value
                intent = target.parentElement.nextElementSibling.innerText.slice(4, target.parentElement.nextElementSibling.innerText.length)
                if(!stepIndex && stepIndex !== 0){
                    stepIndex = target.parentElement.parentElement.dataset.stepindex
                }
            }

            Method.story.setIntentShowBox(examText, intent, stepIndex, Method.story.showNluSpan)
        })
    },
    // 擷取例句字串function
    sliceText: (entityText) => {
        entityText = entityText.replace(/\n/g, '')
        while(entityText.indexOf('≪') > -1){
            const startNum = entityText.indexOf('≪')
            const endNum = entityText.indexOf('≫')
            const entityValueText = entityText.slice(startNum, endNum + 1)
            entityText = entityText.replace(entityValueText, '')
        }
        return entityText
    },
    // 檢核所有例句的意圖
    checkAllExampleIntent: (data) => {
        console.log(data)
        // 重置錯誤訊息
        document.querySelector('#errorMessageBox').innerHTML = ''

        // 獲取例句彈跳窗標題的意圖
        const currentIntent = document.querySelector('#userTextBox .userBoxTitle #intent-text').innerText

        // 獲取例句彈跳窗標題的關鍵字
        const titleEntityNames = document.querySelectorAll('#userTextBox .content .userBoxTitle .entity-name')
        const titleEntityNamesArray = Array.from(titleEntityNames).map(entity => entity.innerText.trim()) 

        // 錯誤訊息
        const checkError = []
        
        // 獲取所有的例句
        const textExamples = document.querySelectorAll('.textExams--examples')

        data.map((example, index) => {
            if(example.intent !== currentIntent){
                checkError.push('例句意圖不符')
                textExamples[index].firstElementChild.firstElementChild.classList.toggle('errorIntent')
            }
            
            const exampleEntityArray = example.entities.map(item => item.entity.trim())
            if((exampleEntityArray.length !== titleEntityNamesArray.length) || (JSON.stringify(exampleEntityArray.sort()) !== JSON.stringify(titleEntityNamesArray.sort()))){
                checkError.push('例句關鍵字不符')
                if(!textExamples[index].firstElementChild.firstElementChild.classList.contains('errorIntent')){
                    textExamples[index].firstElementChild.firstElementChild.classList.toggle('errorIntent')
                }
            }
        })

        if(checkError.length){
            checkError.forEach(text => Method.story.createErrorMessage(text))
            document.querySelector('#sendExam').setAttribute('disabled', '')
        }else{
            document.querySelector('#sendExam').removeAttribute('disabled')
        }
    },
    // 新增錯誤訊息
    createErrorMessage: (messageText) => {
        const errorMessageBox = document.querySelector('#errorMessageBox')
        const errorMessageSpan = document.createElement('span')
        errorMessageSpan.setAttribute('class', 'errorMessageSpan')
        errorMessageSpan.innerText = messageText
        const allErrorSpan = document.querySelectorAll('.errorMessageSpan')
        if((Array.from(allErrorSpan).map(item => item.innerText).indexOf(messageText) === -1) || allErrorSpan.length === 0){
            errorMessageBox.appendChild(errorMessageSpan)
        }
    },
    // 產生使用者例句 function
    createTextsFunc: (data, html, examsTitleHtml) => {
        data.forEach(item => {
            // 產生例句html function
            const examsTextHtml = Method.story.createTextHtml(item, item.text, examsTitleHtml.titleInfo)
            html += `
            <div class="textExams--examples">
            `

            if(document.querySelector('.jh_story') || document.querySelector('.jh_new_story')){
                html += `
                <span>
                    <span id="intent-span" class="nluSpan">
                        <i class="fas fa-tag" style="font-size: 7px;"></i>
                        <span id="intent-text" class="nluText">${item.intent}</span>
                    </span>
                </span>
                `
            }else{
                // 不顯示意圖，僅顯示圖案
                html += `
                <span>
                    <span id="intent-span" class="nluSpan" style="cursor: text;">
                        <i class="fas fa-pencil-alt" style="font-size: 12px"></i>
                    </span>
                </span>
                `
            }
            
            html += `
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
    },
    // 關鍵字背景色產生器
    randomRgba: () => {
        let rgba = ''
        for(i = 0; i < 3; i++){
            if(i == 2){
                rgba += `${Math.floor(Math.random() * 256)}`
            }else{
                rgba += `${Math.floor(Math.random() * 256)}, `
            }
        }
        return rgba
    },
    // 關鍵字顏色產生器
    entityTextColor: (rgba) => {
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
    },
    // 例句文字顏色
    // 例句title產生顏色後回傳titleInfo
    // 例句呼叫此函數時，帶入titleInfo，這樣例句顏色就會跟title一樣
    createTextHtml: (item, userText, titleInfo) => {
        /*
        currentUserText: 要輸出的完整html字句
        textTmp: 要產生的文字
        testText: 已經產生過的文字，用來比對關鍵字以外的字串
        bkgColor: 關鍵字背景色
        textColor: 關鍵字代表值的文字顏色
        colorObj: 用來儲存以產生的關鍵字代號及該關鍵字代號的背景色及文字顏色
        */ 
        let currentUserText = '<div class="waiting" id="textExams-div">' 
        let textTmp = '' 
        let testText ='' 
        let bkgColor = ''
        let textColor = ''
        let colorObj = {}
        
        // 將entities陣列依照entity.start的大小作排序
        // 預防有人不照字句順序添加關鍵字
        item.entities.sort((a, b) => a.start - b.start)

        item.entities.forEach(entityEle => {
            // 判斷開頭是否有關鍵字
            if(entityEle.start > 0 && currentUserText == '<div id="textExams-div">'){
                textTmp = userText.slice(0, entityEle.start)
                currentUserText += `
                    <span>${textTmp}</span>
                `
                testText = textTmp
            }

            // 判斷關鍵字跟關鍵字是否間隔字串
            if((entityEle.start - testText.length) > 0){
                textTmp = userText.slice(testText.length, entityEle.start)
                currentUserText += `
                    <span>${textTmp}</span>
                `
                testText += textTmp
            }

            textTmp = userText.slice(entityEle.start, entityEle.end)
            testText += textTmp

            // 標題
            if(!titleInfo){
                // 判斷是否有重複關鍵字代號
                if(Object.keys(colorObj).indexOf(entityEle.entity) > -1){
                    // 有重複關鍵字代號則使用該關鍵字的背景色及文字顏色
                    bkgColor = colorObj[entityEle.entity].bkgColor
                    textColor = colorObj[entityEle.entity].textColor
                }else{
                    // 沒有重複關鍵字就產生新顏色
                    bkgColor = Method.story.randomRgba()
                    textColor = Method.story.entityTextColor(bkgColor)
                    colorObj[entityEle.entity] = {bkgColor, textColor}
                }
                
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

                currentUserText += `
                        </span>
                    </div>
                `
            }else{
                // 例句
                /***************** 用來判斷使用者例句 ******************/

                if(Object.keys(titleInfo).indexOf(entityEle.entity) > -1){
                    // 有重複關鍵字代號則使用該關鍵字的背景色及文字顏色
                    bkgColor = titleInfo[entityEle.entity].bkgColor
                    textColor = titleInfo[entityEle.entity].textColor
                }else{
                    // 沒有重複關鍵字就產生新顏色
                    bkgColor = Method.story.randomRgba()
                    textColor = Method.story.entityTextColor(bkgColor)
                    colorObj[entityEle.entity] = {bkgColor, textColor}
                }
                /***************** 用來判斷使用者例句 ******************/

                currentUserText += `
                    <span>
                        <div class="examples-entity-label" style="background: rgba(${bkgColor}, 0.5);">
                            <div>
                `

                if(textTmp != entityEle.value){
                    currentUserText += `
                    <span id="examples-entity-text" data-entityname="${entityEle.entity}">
                        ${textTmp}
                        <span class="value-synonym" id="examples-entity-value" style="color: rgb(${textColor});font-weight: bold;">≪"${entityEle.value}"≫</span>
                    `
                }else{
                    currentUserText += `
                    <span id="examples-entity-text" class="entity-no-value"  data-entityname="${entityEle.entity}">
                        ${textTmp}
                    `
                }

                currentUserText += `
                    </span>
                </div>
                <span class="examples-entity-box entity-info" data-status="hidden">
                    <span class="examples-entity-title entity-info">關鍵字資訊</span>
                    <div>
                        <label for="entity-code-input" class="entity-info">代號</label>
                        <p id="entity-code-input" class="form-control entity-info">${entityEle.entity}</p>
                    </div>
                `

                if(textTmp != entityEle.value){
                    currentUserText += `
                            <div>
                                <label for="entity-value-input" class="entity-info">代表值</label>
                                <p id="entity-code-input" class="form-control entity-info">${entityEle.value}</p>
                            </div>
                    `
                }

                /*************************** 以下唯有增刪功能的html(增、刪功能未實作) ***************************/  
                // currentUserText += `
                //     </span>
                // </div>
                // <span class="examples-entity-box entity-info" data-status="hidden">
                //     <span class="examples-entity-title entity-info">編輯關鍵字資訊</span>
                //     <div>
                //         <label for="entity-code-input" class="entity-info">代號</label>
                //         <input id="entity-code-input" type="text" class="form-control entity-info" value="${entityEle.entity}">
                //         <button type="button" id="entity-code-removeBtn" class="btn btn-danger entity-info"><i class="fas fa-trash-alt"></i></button>
                //     </div>
                // `

                // if(textTmp != entityEle.value){
                //     currentUserText += `
                //             <div>
                //                 <label for="entity-value-input" class="entity-info">代表值</label>
                //                 <input id="entity-value-input" type="text" class="form-control entity-info" value="${entityEle.value}">
                //                 <button type="button" id="entity-value-removeBtn" class="btn btn-danger entity-info"><i class="fas fa-trash-alt"></i></button>
                //             </div>
                //     `
                // }else{
                //     currentUserText += `
                //             <div class="entity-option-btns entity-info">
                //                 <button type="button" id="entity-value-addBtn" class="btn btn-info entity-info"><i class="fas fa-plus" style="margin-right: 5px;"></i>代表值</button>
                //             </div>
                //     `
                // }
            }

            currentUserText += `
                    </div>
                </span>
            `
        })

        // 判斷最後一個關鍵字後方是否還有字串
        if(userText.length - testText.length > 0){
            textTmp = userText.slice(testText.length, userText.length)
            currentUserText += `
                <span>${textTmp}</span>
            `
            testText += textTmp
        }
        
        currentUserText += `</div>`

        if(titleInfo){
            currentUserText += `<input class="waiting" type="text" name="entityTextInput" id="entityTextInput" style="width: 100%;" autocomplete="off">`
        }
        
        return {text: currentUserText, titleInfo: colorObj}
    },
    // 例句操作按鈕事件function
    eventFunc: (data, examsTitleHtml) => {
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

        if(document.querySelector('#examples-entity-text') || document.querySelector('#examples-entity-value')){
            const exampleEntityTexts = document.querySelectorAll('#examples-entity-text')
            exampleEntityTexts.forEach(exampleEntityText => {
                exampleEntityText.addEventListener('click', e => {
                    const target = e.target

                    /*
                    examplesEntityLabel => 原始entityBox所在的dom元素
                    entityBox => 要顯示的entityBox的dom元素
                    entityBoxIndex => 要顯示的entityBox dom元素在所有entityBox dom元素的index
                    currentEntityBox => 透過entityBoxIndex在所有entityBox dom元素中取得的正確entityBox dom元素(這一個才可以操作)
                    closeShowBox => showBox關閉視窗後要執行的程式碼，這邊是將entityBox的data-status設回hidden，並將entityBox塞回原本的dom元素底下
                    */
                    let examplesEntityLabel
                    let entityBox
                    if(target.matches('#examples-entity-text')){
                        examplesEntityLabel = target.parentElement.parentElement
                        entityBox = target.parentElement.nextElementSibling
                    }else if(target.matches('#examples-entity-value')){
                        examplesEntityLabel = target.parentElement.parentElement.parentElement
                        entityBox = target.parentElement.parentElement.nextElementSibling
                    }

                    entityBox.setAttribute('data-status', 'show')
                    const allEntityBox = document.querySelectorAll('.examples-entity-box')
                    let entityBoxIndex
                    for(i = 0; i < allEntityBox.length; i++){
                        if(allEntityBox[i].dataset.status === 'show'){
                            entityBoxIndex = i
                        }
                    }
                    const currentEntityBox = allEntityBox[entityBoxIndex]
                    
                    Method.common.showBox('', 'entityShowBox', '',closeShowBox)
                    document.querySelector('#entityShowBox .content').appendChild(entityBox)

                    function closeShowBox(){
                        currentEntityBox.setAttribute('data-status', 'hidden')
                        examplesEntityLabel.appendChild(currentEntityBox)
                    }
                })
            })
        }

        // 例句意圖點擊事件
        if(document.querySelector('.jh_story') || document.querySelector('.jh_new_story')){
            const textExamsExamples = document.querySelectorAll('.textExams--examples')
            textExamsExamples.forEach(textExamsExample => {
                textExamsExample.children[0].addEventListener('click', e => {
                    const target = e.target
                    let intent = ''
                    let examText = ''
                    if(target.matches('#intent-text')){
                        console.log('#intent-text examText: ', target.parentElement.parentElement.nextElementSibling.children[0].innerText)
                        intent = target.innerText
                        examText = Method.story.sliceText(target.parentElement.parentElement.nextElementSibling.children[0].innerText)
                    }

                    if(target.matches('#intent-span')){
                        console.log('#intent-span examText: ', target.parentElement.nextElementSibling.children[0].innerText)
                        intent = target.lastElementChild.innerText
                        examText = Method.story.sliceText(target.parentElement.nextElementSibling.children[0].innerText)
                    }

                    if(target.matches('svg')){
                        console.log('svg examText: ', target.parentElement.parentElement.nextElementSibling.children[0].innerText)
                        intent = target.nextElementSibling.innerText
                        examText = Method.story.sliceText(target.parentElement.parentElement.nextElementSibling.children[0].innerText)
                    }

                    if(target.matches('path')){
                        console.log('path examText: ', target.parentElement.parentElement.parentElement.nextElementSibling.children[0].innerText)
                        intent = target.parentElement.nextElementSibling.innerText
                        examText = Method.story.sliceText(target.parentElement.parentElement.parentElement.nextElementSibling.children[0].innerText)
                    }
                    console.log('intent: ', intent)
                    console.log('examText: ', examText)
                    const examTempData = JSON.parse(localStorage.getItem('textExamData'))
                    Method.story.setIntentShowBox(examText, intent, null, null, examTempData, examsTitleHtml)
                })
            })
        }

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

                // 檢查是否有編輯狀態的輸入框
                // 如果有在編輯狀態的輸入框，就將移除編輯狀態
                for(i = 0; i < editBtns.length; i++){
                    if(editBtns[i].getAttribute('disabled') === ''){
                        editBtns[i].parentElement.parentElement.parentElement.previousElementSibling.children[1].setAttribute('class', 'waiting')
                        editBtns[i].parentElement.parentElement.parentElement.previousElementSibling.children[0].setAttribute('class', 'waiting')
                        editBtns[i].removeAttribute('disabled')
                    }
                }

                if(target.matches('#textExams--actionBtn_editBtn')){
                    const targetElement = target.parentElement.parentElement.parentElement.previousElementSibling.children[0]
                    const targetInput = target.parentElement.parentElement.parentElement.previousElementSibling.children[1]
                    target.setAttribute('disabled', '')
                    clickEditBtn(targetElement, targetInput)
                }

                if(target.tagName == 'svg'){
                    const targetElement = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[0]
                    const targetInput = target.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[1]
                    target.parentElement.setAttribute('disabled', '')
                    clickEditBtn(targetElement, targetInput)
                }

                if(target.tagName == 'path'){
                    const targetElement = target.parentElement.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[0]
                    const targetInput = target.parentElement.parentElement.parentElement.parentElement.parentElement.previousElementSibling.children[1]
                    target.parentElement.parentElement.setAttribute('disabled', '')
                    clickEditBtn(targetElement, targetInput)
                }

                // 點擊編輯按鈕function
                function clickEditBtn(targetElement, targetInput){
                    let entityText = targetElement.innerText
                    const exampleTitle = Method.story.sliceText(document.querySelector('#userTextTitle').innerText)
                    entityText = Method.story.sliceText(entityText)
                    targetElement.setAttribute('class', 'editing')
                    targetInput.setAttribute('class', 'editing')
                    targetInput.value = entityText
                    targetInput.select()
                    localStorage.setItem('editExamText', entityText)
                    localStorage.setItem('exampleTitle', exampleTitle)

                    // 編輯輸入框enter事件
                    const allEntityTextInput = document.querySelectorAll('#entityTextInput')
                    allEntityTextInput.forEach(entityTextInput => {
                        entityTextInput.addEventListener('keyup', e => {
                            const target = e.target
                            if(e.keyCode == 13){
                                target.setAttribute('class', 'waiting')
                                target.previousElementSibling.setAttribute('class', 'waiting')
                                target.parentElement.nextElementSibling.children[0].children[0].children[0].removeAttribute('disabled')
                                let arrayNum
                                // 檢查輸入框的值是否為空或與編輯前相同
                                if(target.value === entityText || target.value === '') return

                                const textExamData = JSON.parse(localStorage.getItem('textExamData'))

                                // 檢查輸入框的值是否與其他例句相同
                                for(let i = 0; i < textExamData.length; i++){
                                    if(textExamData[i].text === target.value){
                                        var html = "<h2><div class='sa-icon warning'><span></span></div>例句重複</h2>";
                                        Method.common.showBox(html, 'message', '')
                                        return
                                    }
                                }

                                const editingExamText = localStorage.getItem('editExamText')

                                for(i = 0; i < data.length; i++){
                                    if(textExamData[i].text == editingExamText){
                                        arrayNum = i
                                    }
                                }

                                fetch(`http://192.168.10.127:3030/jh_story/userStep/nlu/checkRepeat?userInput=${target.value}`)
                                .then(res => res.json())
                                .then(info => {
                                    if(info.status !== 'success'){
                                        var html = `<h2><div class='sa-icon warning'><span></span></div>${info.message}</h2>`;
                                        Method.common.showBox(html, 'message', '')
                                        return
                                    }
                                    fetch(`http://192.168.10.127:3030/jh_story/parse?userInput=${target.value}`)
                                    .then(response => response.json())
                                    .then(textParse => {
                                        const newExamText = {
                                            text: textParse.text,
                                            intent: textParse.intent.name,
                                            entities: textParse.entities
                                        }
                                        textExamData.splice(arrayNum, 1, newExamText)
                                        const exampleTitle = localStorage.getItem('exampleTitle')
                                        const newData = textExamData.filter(item => item.text !== exampleTitle)
                                        localStorage.setItem('textExamData', JSON.stringify(newData))
                                        return newData
                                    })
                                    .then(newData => {
                                        let newExamHtml = ''
                                        newExamHtml = Method.story.createTextsFunc(newData, newExamHtml, examsTitleHtml)
                                        document.querySelector('#textExams-panel').innerHTML = newExamHtml
                                        Method.story.checkAllExampleIntent(newData)
                                        Method.story.eventFunc(newData, examsTitleHtml)
                                    })
                                    .catch(err => console.log(err))
                                })
                            }
                        })
                    })
                }
            })
        })

        // 例句彈跳窗 移除按鈕點擊事件
        const removeBtns = document.querySelectorAll('#textExams--actionBtn_trashBtn')
        removeBtns.forEach(removeBtn => {
            removeBtn.addEventListener('click', e => {
                const target = e.currentTarget
                const examText = Method.story.sliceText(target.parentElement.parentElement.parentElement.previousElementSibling.innerText)

                const exampleTitle = Method.story.sliceText(document.querySelector('#userTextBox .content .userTextTitle').innerText)

                const textExamData = JSON.parse(localStorage.getItem('textExamData'))
                const newData = textExamData.filter(exam => {
                    if(exam.text !== examText){
                        return exam
                    }
                })
                localStorage.setItem('textExamData', JSON.stringify(newData)) // 將彈跳窗內的資料全部存在localStorage，包含標題
                const currentData = newData.filter(exam => exam.text !== exampleTitle) // 顯示時，將標題篩選掉

                let newExamHtml = ''
                newExamHtml = Method.story.createTextsFunc(currentData, newExamHtml, examsTitleHtml)
                document.querySelector('#textExams-panel').innerHTML = newExamHtml
                if(document.querySelector('.jh_story') || document.querySelector('.jh_new_story')){
                    Method.story.checkAllExampleIntent(currentData)
                }
                Method.story.eventFunc(currentData, examsTitleHtml)
            })
        })
    },
    // 設定意圖彈跳窗
    setIntentShowBox: (examText, intent, indexNum, showNluSpan, examTempData, examsTitleHtml) => {
        let intentHtml = ``
        let entitiesHtml = ``
        // 串接後端API抓取所有意圖
        fetch(`http://192.168.10.127:3030/jh_story/userStep/domain/getAllIntents`)
        .then(response => response.json())
        .then(intents => {
            // 透過展開運算子複製意圖陣列
            let intentArray = [...intents]
            let defaultIntent = ''
            intentHtml = createIntentList(intentArray, intent)
            
            function createIntentList(intentArray, intent){
                let intentHtml = ''

                // 將預設意圖移到陣列第一個位置
                for(i = 0; i < intentArray.length; i++){
                    if(intentArray[i] == intent){
                        defaultIntent = intentArray[i]
                        intentArray.splice(0, 0 , intentArray[i])
                        intentArray.splice(i + 1, 1)
                    }
                }

                // 產生意圖清單
                for(i = 0; i < intentArray.length; i++){
                    if(intentArray[i] == intent){
                        intentHtml += `
                            <span class="setExamInfo--intents_item selected">
                                ${intentArray[i]}
                            </span>
                        `
                    }else{
                        intentHtml += `
                            <span class="setExamInfo--intents_item">
                                ${intentArray[i]}
                            </span>
                        `
                    }
                }

                // 產生建立新意圖及取消按鈕
                intentHtml += `
                    <span class="setExamInfo--intents_item create-intent">
                        建立新意圖
                    </span>

                    <span class="setExamInfo--intents_item cancel">
                        取消
                    </span>
                `
                return intentHtml
            }

            fetch(`http://192.168.10.127:3030/jh_story/userStep/nlu/setEntity/getTextExam?examText=${examText}`)
            .then(response => response.json())
            .then(targetNlu => {
                // tempNlu深層拷貝targetNlu，更改tempNlu值不會影響原始targetNlu，所以可以當作儲存前的操作資料
                let tempNlu = ''
                if(!examTempData){
                    tempNlu = JSON.parse(JSON.stringify(targetNlu[0]))
                    localStorage.setItem('tempNlu', JSON.stringify(tempNlu))
                    entitiesHtml = createEntitiesHtml(tempNlu, examText)
                }else{
                    tempNlu = examTempData.filter(examData => examData.text === examText)
                    localStorage.setItem('tempNlu', JSON.stringify(tempNlu[0]))
                    entitiesHtml = createEntitiesHtml(tempNlu[0], examText)
                }

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
                }
                
                let html = ``

                html += `
                    <div>
                        <h1>意圖及關鍵字設定</h1>
                        <span class="setExamInfo--content">
                            <input class="setExamInfo--examText form-control" value="${examText}" readonly>
                            <span class="setExamInfo--intents">
                                <input id="intentInput" name="intentInput" type="text" class="form-control" placeholder="請選擇意圖或新增意圖" value="${defaultIntent}" autocomplete="off" disabled>
                                <span class="setExamInfo--intents_list list--disabled">${intentHtml}</span>
                            </span>
                            <span class="setExamInfo--entities">
                                ${entitiesHtml}
                            </span>
                        </span>
                        <span class="setExamInfo--footer">
                            <button id="saveExamInfo" type="button" class="btn btn-info">儲存</button>
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
                        target.select()
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

                    // 意圖輸入框enter事件
                    document.querySelector('#intentInput').addEventListener('keyup', e => {
                        const target = e.target
                        if(e.keyCode === 13){
                            const intentList = target.nextElementSibling
                            createIntent(target, intentArray, intentList)
                        }
                    })

                    // 意圖清單點擊事件
                    document.querySelector('.setExamInfo--intents_list').addEventListener('click', e => {
                        const target = e.target

                        // 意圖點擊事件
                        if(target.matches('.setExamInfo--intents_item')){
                            const intentList = target.parentElement
                            const intentInput =  target.parentElement.previousElementSibling
                            const selectIntent = target.innerText.trim()

                            if(!target.matches('.create-intent') && !target.matches('.cancel')){
                                // 隱藏意圖清單
                                intentList.classList.add('list--disabled')
                                
                                // 更新意圖清單
                                if(!target.matches('.selected')){
                                    const newIntentListHtml = createIntentList(intentArray, selectIntent)
                                    intentList.innerHTML = newIntentListHtml
                                }

                                // 將意圖清單的值給input並把input設為disabled
                                editExamInfo(selectIntent, intentInput)
                            }
                            
                            // 取消按鈕點擊事件
                            if(target.matches('.cancel')){
                                intentList.classList.add('list--disabled')
                                intentInput.setAttribute('disabled', '')
                            }

                            // 點選新建意圖事件
                            if(target.matches('.create-intent')){
                                createIntent(intentInput, intentArray, intentList)
                            }

                            // 意圖點擊 function
                            function editExamInfo(intent, input){
                                input.value = intent
                                input.setAttribute('disabled', '')
                                const tempNlu = JSON.parse(localStorage.getItem('tempNlu'))
                                tempNlu.intent = intent
                                localStorage.setItem('tempNlu', JSON.stringify(tempNlu))
                            }
                        }
                    })

                    // 意圖及關鍵字儲存按鈕點擊事件
                    document.querySelector('#saveExamInfo').addEventListener('click', e => {
                        const target = e.target
                        const intentInput = target.parentElement.previousElementSibling.children[1].children[0]
                        const storyName = document.querySelector('#storyTitle').innerText

                        // 沒有意圖錯誤處理
                        if(!intentInput.value){
                            var warningHtml = "<h2><div class='sa-icon warning'><span></span></div>意圖為必填欄位</h2>";
                            Method.common.showBox(warningHtml, 'message', '')
                            return
                        }

                        // 獲取更新後的nlu資料
                        const tempNlu = localStorage.getItem('tempNlu')
                        console.log('examTempData:', examTempData)
                        if(!examTempData){
                            const payload = {
                                tempNlu
                            }
                            // 串接後端API更新rasa nlu訓練檔並更新資料庫
                            fetch(`http://192.168.10.127:3030/jh_story/userStep/nlu`, {
                                method: 'put',
                                body: JSON.stringify(payload),
                                headers: {
                                    'Content-Type': "application/json",
                                },
                            })
                            .then(response => response.json())
                            .then(nluStatus => {
                                if(nluStatus.status == 'success'){
                                    // 串接後端API更新rasa domain訓練檔並更新資料庫
                                    fetch(`http://192.168.10.127:3030/jh_story/userStep/domain`, {
                                        method: 'put',
                                        body: JSON.stringify(payload),
                                        headers: {
                                            'Content-Type': "application/json",
                                        },
                                    })
                                    .then(response => response.json())
                                    .then(domainStatus=> {
                                        if(domainStatus.status == 'success'){
                                            // 串接後端API更新rasa 
                                            const payload = {
                                                tempNlu,
                                                storyName,
                                                indexNum
                                            }
                                            fetch(`http://192.168.10.127:3030/jh_story/userStep/fragments`,{
                                                method: 'put',
                                                body: JSON.stringify(payload),
                                                headers: {
                                                    'Content-Type': "application/json",
                                                },
                                            })
                                            .then(response => response.json())
                                            .then(data => {
                                                if(data.status == 'success'){
                                                    // 關閉彈跳視窗
                                                    document.querySelector('#setExamInfo').remove()
                                                    // 將關鍵字和意圖區清空
                                                    const allStorySpan = document.querySelectorAll('#storySpan')
                                                    allStorySpan[indexNum].children[1].innerHTML = ''
                                                    // 更新關鍵字和意圖
                                                    showNluSpan(JSON.parse(tempNlu), allStorySpan, indexNum)
                                                }
                                            })
                                            .catch(err => console.log(err))
                                        }
                                    })
                                    .catch(err => console.log(err))
                                }
                            })
                            .catch(err => console.log(err))
                        }else{
                            const examTextTitle = Method.story.sliceText(document.querySelector('#userTextBox .content #userTextTitle').innerText)
                            const textExamPanel = document.querySelector('#userTextBox .content #textExams-panel')
                            examTempData.map(exam => {
                                if(exam.text === examText){
                                    const examIndex = examTempData.indexOf(exam)
                                    examTempData.splice(examIndex, 1, JSON.parse(tempNlu))
                                }
                            })
                            document.querySelector('#setExamInfo').remove()
                            localStorage.setItem('textExamData', JSON.stringify(examTempData))
                            examTempData = examTempData.filter(exam => exam.text !== examTextTitle)
                            let newExamHtml = ''
                            console.log('final examTempData:', examTempData)
                            newExamHtml = Method.story.createTextsFunc(examTempData, newExamHtml, examsTitleHtml)
                            textExamPanel.innerHTML = newExamHtml
                            Method.story.checkAllExampleIntent(examTempData)
                            Method.story.eventFunc(examTempData, examsTitleHtml) 
                        }
                        
                    })
                    // 建立新意圖 function
                    function createIntent(intentInput, intentArray, intentList){
                        // 沒填意圖
                        if(intentInput.value == ""){
                            var warningHtml = "<h2><div class='sa-icon warning'><span></span></div>請先填寫意圖</h2>";
                            Method.common.showBox(warningHtml, 'message', '')
                            return
                        }

                        function editExamInfo(intent, input){
                            input.value = intent
                            input.setAttribute('disabled', '')
                            const tempNlu = JSON.parse(localStorage.getItem('tempNlu'))
                            tempNlu.intent = intent
                            localStorage.setItem('tempNlu', JSON.stringify(tempNlu))
                        }

                        // 判斷意圖是否重複
                        for(i = 0; i < intentArray.length; i++){
                            if(intentInput.value == intentArray[i]){
                                intentList.classList.add('list--disabled')
                                intentInput.setAttribute('disabled', '')
                                editExamInfo(intentArray[i], intentInput)
                                const newIntentListHtml = createIntentList(intentArray, intentArray[i])
                                intentList.innerHTML = newIntentListHtml
                                return
                            }
                        }

                        // 新建意圖
                        intentList.classList.add('list--disabled')
                        const tempNlu = JSON.parse(localStorage.getItem('tempNlu'))
                        tempNlu.intent = intentInput.value.trim()
                        intentInput.setAttribute('disabled', '')
                        intentArray.push(intentInput.value.trim())
                        localStorage.setItem('tempNlu', JSON.stringify(tempNlu))
                        const newIntentListHtml = createIntentList(intentArray, intentInput.value.trim())
                        intentList.innerHTML = newIntentListHtml
                    }
                    
                    entitiesRemoveBtnEvent()

                    // 關鍵字刪除按鈕點擊事件
                    function entitiesRemoveBtnEvent(){
                        const allEntityRemoveBtns = document.querySelectorAll('.entity--remove_btn')
                        const tempNlu = JSON.parse(localStorage.getItem('tempNlu'))

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

                                localStorage.setItem('tempNlu', JSON.stringify(tempNlu))
                            })
                        })
                    }

                    createEntity()

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
                                        setEntityBox(getText().text, getText().start, getText().end)
                                    }
                                }
                            })
                
                            // 回傳選取的文字
                            function getText(){
                                const elem = document.querySelector('.setExamInfo--examText')
                                return {text:elem.value.substring(elem.selectionStart, elem.selectionEnd), start: elem.selectionStart, end: elem.selectionEnd}
                            }

                            // 設定關鍵字彈跳窗
                            function setEntityBox(getText, start, end){
                                const tempNlu = JSON.parse(localStorage.getItem('tempNlu'))

                                if(tempNlu.entities.length){
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
                                    localStorage.setItem('tempNlu', JSON.stringify(tempNlu))
                                    const newEntitiesHtml = createEntitiesHtml(tempNlu, examText)
                                    document.querySelector('#setEntityBox').remove()
                                    document.querySelector('.setExamInfo--entities').innerHTML = newEntitiesHtml
                                    entitiesRemoveBtnEvent()
                                })
                            }
                        }
                    }
                }
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    },
    // 修改故事名稱按鈕
    editStoryTitle: () => {
        const storyTitleEdit = document.querySelector('#storyTitleEdit')
        storyTitleEdit.addEventListener('click', e => {
            const originalTitle = storyTitle.innerText
            const updateTitle = prompt('請輸入故事名稱', '')

            if(updateTitle == null) return 

            if(updateTitle == ''){
                var html = "<h2><div class='sa-icon warning'><span></span></div>故事名稱不可為空白</h2>";
                Method.common.showBox(html, 'message', '')
                return
            }
            const payload = {
                originalTitle,
                updateTitle
            }
            fetch(`http://192.168.10.127:3030/jh_story/storyTitle`,{
                method: 'put',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': "application/json",
                },
            })
            .then(response => response.json())
            .then(data => {
                if(data.status){
                    var html = "<h2><div class='sa-icon " + data.status + "'><span></span></div>" + data.message + "</h2>";
                    Method.common.showBox(html, 'message', '')
                    return
                }
                storyTitle.innerText = data.updateTitle
                if(document.querySelector('#removeStoryName')){
                    document.querySelector('#removeStoryName').innerText = data.updateTitle
                }
                if(document.querySelector('#storyFilter')){
                    Array.from(document.querySelector('#storyFilter').children).map(item => {
                        if(item.innerText === originalTitle){
                            item.setAttribute('value', data.updateTitle)
                            item.innerText = data.updateTitle
                        }
                    })
                }
            })
            .catch(err => console.log(err))
        })
    },
    // 抓取故事流程名稱
    getStoryTitle: () => {
        const titleContainer = document.querySelector('#title-container')
        const storyTitle = document.querySelector('#storyTitle')
        const titleBtn = document.querySelector('#titleBtn')
    
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
                const payload = {
                    storyTitle: target.innerText
                }
                fetch(`http://192.168.10.127:3030/jh_story/storyTitle`,{
                    method: 'post',
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': "application/json",
                    },
                })
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
                const payload = {
                    storyTitle: target.innerText
                }
                fetch(`http://192.168.10.127:3030/jh_story/storyTitle`,{
                    method: 'post',
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': "application/json",
                    },
                })
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

            if(document.querySelector(".jh_simple_story")){
                url += "/jh_simple_story/filter";
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