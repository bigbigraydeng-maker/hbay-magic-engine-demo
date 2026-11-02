window.GiveawayNinja = {
    cdn: "//cdn.giveaway.ninja/widget/",
    uploads: "//cdn.giveaway.ninja/uploads/",
    api: "//api.giveaway.ninja/api",
    language: "auto",
    version: 2,
}
 
function loadScriptGiveawayNinja(url, callback) {

    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState) {  //IE
        script.onreadystatechange = function () {
            if (script.readyState == "loaded" ||
                    script.readyState == "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function () {
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}



function addGiveawayNinjaScript() {

   
    if (window.jQuery) {
        if (GiveawayNinja.init) { return; }
        var script = document.createElement('script');
        script.src = GiveawayNinja.cdn + 'scripts/giveawayninja.js?v=' + GiveawayNinja.version;
        script.onload = function () { GiveawayNinja.init(); }
        document.body.appendChild(script);
    }
    else {
        window.addGiveawayNinjaScriptAttempt++;

        if (window.addGiveawayNinjaScriptAttempt == 3) {
            console.log("GiveawayNinja - loading jQuery ");

            loadScriptGiveawayNinja('/_ext/ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js', function () {
            
                addGiveawayNinjaScript();
            });
        }

        if (window.addGiveawayNinjaScriptAttempt < 3) {
            console.log("GiveawayNinja - waiting for jQuery - attempt " + window.addGiveawayNinjaScriptAttempt)
            window.setTimeout(addGiveawayNinjaScript, 300);
        }
      
    }
}

window.addGiveawayNinjaScriptAttempt = 0;

addGiveawayNinjaScript();