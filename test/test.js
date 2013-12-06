publicProfile.factory('helpers', ['$timeout', '$q', function($timeout, $q) {
  'use strict';

  var helpers = {

    // Get company account id of currently logged in user
    getLoggedInCompanyAccountId: function(){
      var companyAccountId;
      try {
        companyAccountId = window.parent.document.getElementsByName('Tradeshift-TenantId')[0].content;
      }catch(err){
        console.log("Using hardcoded company acccount id");
        companyAccountId = "ee1ee9ea-b8d5-4e1f-8069-edb940d9f42b";
      }

      return companyAccountId;
    },

    // get company account id of the company being viewed right now
    getViewedCompanyAccountId: function(){
      var companyId = this.getParameterByName('companyId');
      if(companyId === "" || companyId === undefined ){
        companyId = this.getLoggedInCompanyAccountId();
      }
      return companyId;
    },

    // determine if the currently logged in user is the owner of the currently viewed profile
    isOwner: function(){
      return this.getViewedCompanyAccountId() === this.getLoggedInCompanyAccountId();
    },

    getParameterByName: function(name) {
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
        var results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    },

    // Get full address by stitching together
    getAdressLinesAsString: function(addressLines){
      if(addressLines === undefined) return;

      var addressLinesAsString = "";

      if(this.getAddressLine(addressLines, "buildingnumber"))
        addressLinesAsString += this.getAddressLine(addressLines, "buildingnumber") + ' ';
      if(this.getAddressLine(addressLines, "street"))
        addressLinesAsString += this.getAddressLine(addressLines, "street") + ' ';
      if(this.getAddressLine(addressLines, "zip"))
        addressLinesAsString += this.getAddressLine(addressLines, "zip") + ' ';
      if(this.getAddressLine(addressLines, "state"))
        addressLinesAsString += this.getAddressLine(addressLines, "state") + ' ';
      if(this.getAddressLine(addressLines, "city"))
        addressLinesAsString += this.getAddressLine(addressLines, "city");

      return addressLinesAsString;
    },

    // get addressModel
    getAddressModel: function(addressLines){
      return {
        "buildingnumber": this.getAddressLine(addressLines, 'buildingnumber'),
        "street": this.getAddressLine(addressLines, 'street'),
        "zip": this.getAddressLine(addressLines, 'zip'),
        "state": this.getAddressLine(addressLines, 'state'),
        "city": this.getAddressLine(addressLines, 'city')
      };
    },

    // Get specific address line
    getAddressLine: function(addressLines, addressLineScheme){
      var filteredResults = addressLines.filter(function(addressLine){
        return addressLine.scheme === addressLineScheme;
      });

      if(filteredResults[0]){
        // dirty hack: the backend doesn't allow empty strings but we can't force the user to supply an address
        if(filteredResults[0].value === "unset"){
          return "";
        }else{
          return filteredResults[0].value;
        }
      }else{
        return null;
      }
    },

    // build address line structure for the backend to understand
    getAddressLines: function(addressModel){
      return [
        {
          "scheme": "street",
          "value": addressModel.street || "unset"
        },
        {
          "scheme": "buildingnumber",
          "value": addressModel.buildingnumber || "unset"
        },
        {
          "scheme": "zip",
          "value": addressModel.zip || "unset"
        },
        {
          "scheme": "state",
          "value": addressModel.state || "unset"
        },
        {
          "scheme": "city",
          "value": addressModel.city || "unset"
        }
      ];
    },

    toggleElementHeight: function(target, showElement){
      // calculate initial height
      this.clientHeight = this.clientHeight || target.clientHeight;

      // change height - use timeout to add delay, so that the css class has been added to the DOM
      var timeoutFunction = $timeout(function() {
        target.style.height = showElement ? target.scrollHeight + 'px' : this.clientHeight + 'px';
      }.bind(this), 0);
    },

    getUuid: function(){
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
          return v.toString(16);
      });
    },

    // close one or all asides
    closeAside: function(asideName){
      var asideClassName = asideName !== undefined ? "." + asideName : "";
      var openSidebars = document.querySelectorAll(".ts-aside" + asideClassName + '[gui\\.open="true"]');
      for (var i=0; i < openSidebars.length; i++) {
          // console.log("Close aside", openSidebars[i]);
          openSidebars[i].setAttribute("gui.open","false");
      }
      return openSidebars[openSidebars.length-1]; // return last (top most) aside
    }

  };

  return helpers;
}]);