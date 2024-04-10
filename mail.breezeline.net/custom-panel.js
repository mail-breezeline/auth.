(function() {

    function addToolbar() {
        if (typeof $ === "undefined") {
            setTimeout(addToolbar, 1000);
            return
        } else {
            $(function() {
                if (typeof $('.pronto-navigation') === "object" && typeof $('.pronto-content_type_mail') === "object") {
                    $("body").append('<div class="top-buttons">' + '<a class="email" target="_blank" href="https://manage.my.breezeline.com">Email Tools</a>' + '<a class="email" target="_blank" href="https://www.breezeline.com/support">Help</a>' + '</div>');
                };
            });
        }
    }

    addToolbar();
}());