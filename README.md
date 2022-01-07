# RASA-INTERFACE
RASA為聊天機器人的訓練核心，而RASA-INTERFACE是用於新增或刪除RASA的訓練資料  
目前主要用於棉花糖客服機器人
# Features
* 有登入功能
* 可以新增、刪除功能
* 可以新增、刪除問答資訊
* 可以通過篩選，查看所需資料
* 會自動將最新資料存進資料庫
* 訓練時會自動生成所需訓練檔
* 能夠在頁面直接與聊天機器人測試

![image](/public/images/rasa-interface-login.PNG)
![image](/public/images/rasa-interface-home.PNG)
![image](/public/images/rasa-interface-addfunc.PNG)
![image](/public/images/rasa-interface-addques.PNG)
![image](/public/images/rasa-interface-chatbot.PNG)

# Getting Started
Clone repository to your local computer
```
$ git clone https://github.com/naluwan/rasa-interface.git
```
Install by npm
```
$ npm install
```
Execute
```
$ npm run dev
```
Terminal show the message
```
Express is running on localhost:3030
```
Now you can browse the website on
```
http://localhost:3030
```
<!-- Test account

>* name: user1
>* email: user1@example.com
>* password: 12345678
>* name: user2
>* email: user2@example.com
>* password: 12345678 -->
# Built With
* Node.js: 10.24.1
* bcryptjs: 2.4.3
* body-parser: 1.19.1
* connect-flash: 0.1.1
* dotenv: 10.0.0
* express: 4.17.2
* express-handlebars: 6.0.2
* express-session: 1.17.2
* handlebars-helpers: 0.10.0
* js-yaml: 4.1.0
* method-override: 3.0.0
* mssql: 7.3.0
* nodemailer: 6.7.2
* nodemon: 2.0.15
* passport: 0.5.2
* passport-local: 1.0.0
 
# Author
Harry Chien 簡碩亨 
Email： street.baller06@gmail.com