self.addEventListener("message", function(e) {

    if(e.data[0] == "asyncAjax"){
        var XML = new XMLHttpRequest();
        XML.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                self.postMessage(this.responseText);
            };
        };
        XML.open("GET", e.data[1]);
        XML.send();
    };    
});