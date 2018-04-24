var activeIssue = undefined;  
var urlOrganisation = undefined;  
var urlRepository = undefined;  
var urlIssueId = undefined;  

function isRunningAsExtension() {
    return (window.chrome && chrome.runtime && chrome.runtime.id);
}

function storeUser(token){
    if(isRunningAsExtension()) {
        chrome.storage.local.set({user: token}, function() {
            if(!chrome.runtime.lastError){
                console.log('Stored:' + token);
            }else {
                console.log('Stored:' + chrome.runtime.lastError);
            }   
            
          });
        
    } else {
        window.localStorage.setItem('__u', token);
    }
}

function getStoredUser(resultFunction) {
    if(isRunningAsExtension()) {
  
        chrome.storage.local.get('user', function(items) {
            if(items.user) {
                console.log(items);
                console.log('Got value from store: ' + items.user);
                resultFunction(items.user);
            } else {
                resultFunction(undefined);
            }

        });
    } else {
        resultFunction(window.localStorage.getItem("__u"));
    }

    
}

function setRepositoriesForOrganisation(organisation, selectBoxname){
    
    github_getRepositoriesForOrganisation(organisation, function(reposData) {
        console.log('Getting repos for .....' + organisation);

        $(selectBoxname)
            .find('option')
            .remove()
            .end();
            
        var urlRepoFullName = urlOrganisation + '/' + urlRepository;
        $.each(reposData, function(key, repo) 
        {
            $(selectBoxname).append('<option value="' + repo.full_name + '" ' + (repo.full_name === urlRepoFullName ? 'SELECTED' : '' ) +  ' >' + repo.full_name + '</option>');
        });
        $(selectBoxname).trigger('change');    

    });    
}

function fillThePageWithGithubData() {
    github_getOrganisations(function( reposData ) {
        
        userRepositories = reposData;
        $.each(reposData, function(key, repo) 
        {
            $('#selGithubOrganisations').append('<option value=' + repo.login + '>' + repo.login + '</option>');
            $('#selToGithubOrganisations').append('<option value=' + repo.login + '>' + repo.login + '</option>');
        });

        if(isRunningAsExtension()) {
            chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
                var url = tabs[0].url;
                if(url.indexOf("https://github.com/") == 0) {
                    url = url.replace("https://github.com/", "");
                    var paths = url.split("/");
                    urlOrganisation = paths[0];
                    urlRepository = paths[1];
                    urlIssueId = paths[3];
                }
                $('#txtIssueId').val(urlIssueId)
                $('#selGithubOrganisations').val(urlOrganisation);
                $('#selGithubOrganisations').trigger('change');
            });
        } else{
            $('#selGithubOrganisations').trigger('change');
        }
    });
}

function setRepositoryMilestones(repoFullname) {
        github_getRepositorieMilestones(repoFullname, function( milestones ) {
            console.log('Getting milstones for .....' + repoFullname);
            $('#selToGithubMilestones')
                .find('option')
                .remove()
                .end();

            $('#selToGithubMilestones').append('<option value="0">Not set milestone</option>');
                $.each(milestones, function(key, milestone) 
                {
                    $('#selToGithubMilestones').append('<option value=' + milestone.number + '>' + milestone.title + '</option>');
                });
                
                $('#selToGithubMilestones option[value="0"]').attr("selected",true);  
                
            });           
}

function showAlert(message, success) {
    
    $('#alertMessage')
        .empty()
        .append(message)
        .addClass(success ? 'alert-success'  : 'alert-danger')
        .removeClass(!success ? 'alert-success'  : 'alert-danger')
        .show();
}

function hideAlert(){
    $('#alertMessage').hide();
}    

function showHideUserInfoDialog(showDialog){
    if(showDialog) {
        $("#userInfoDialog").show();
        $("#workspace").hide();
    }else{
        $("#userInfoDialog").hide();
        $("#workspace").show();
        
    }
}

function showDestination(show){
    if(show) {
        $("#gitDestination").show();
        $("#moveDiv").show();
    } else {
        $("#gitDestination").hide();
        $("#moveDiv").hide();
    }
}


$(document).ready(function(){

    /* Setup the page */
    $("#githubIssue").hide();
    hideAlert();
    $("#moveIssue").prop("disabled", true);
    showHideUserInfoDialog(false);
    showDestination(false);

    getStoredUser(function(usertoken) {
        console.log(usertoken);

        if(usertoken) {
            github_configure(usertoken, function  (jqXHR,  textStatus,  errorThrow)
            {
                showAlert(errorThrow, false);
            });
            fillThePageWithGithubData();
        } else {
            showHideUserInfoDialog(true);
        }
    
    });

    /* Add event handlers */    
    $('#selGithubOrganisations').change(function() {
        console.log('new source org selected.....' + $(this).val());
        setRepositoriesForOrganisation($(this).val(), '#selGithubRepositories');
    });

    $('#selToGithubOrganisations').change(function() {
        console.log('new destination org selected.....' + $(this).val());
        setRepositoriesForOrganisation($(this).val(), '#selToGithubRepositories');
    });

    $('#selToGithubRepositories').change(function() {
        console.log('new destination repo selected.....' + $(this).val());
        setRepositoryMilestones($('#selToGithubRepositories').val());                        
    });

    $("#getIssue").click(function() {
        console.log('get issue clicked');
        $('#githubIssue').empty();
        hideAlert();
        github_getIssue($('#selGithubRepositories').val(), $('#txtIssueId').val(), function( issueData ) {
           
            var html = '<div class="panel-heading">' + issueData.title + '</div><div class="panel-body">' + issueData.body_html + '</div>';
            
            $('#githubIssue').append(html);
            $("#githubIssue").show();    
            $("#moveIssue").prop("disabled", false);
            
            $('#selToGithubOrganisations option[value="' + $('#selGithubOrganisations').val() + '"]').attr("selected",true);

            $('#selToGithubOrganisations').trigger('change');
            showDestination(true);
            activeIssue = issueData;
                 
        });
    });

    $("#moveIssue").click(function() {
        console.log('move issue clicked');
        $("#moveIssue").prop("disabled", true);
        hideAlert();
        if(activeIssue === undefined) {
            return;
        }
        var comment = "This is a copy of " + activeIssue.html_url + ". See that for the full history.\r\n\r\n";
        activeIssue.body = comment + activeIssue.body ;
        github_CopyIssue($('#selToGithubRepositories').val(), activeIssue, $('#selToGithubMilestones').val(), function( newIssue ) {
            console.log('New issue created');
            showAlert('Issue copied to <a target="_blank" href="' + newIssue.html_url + '">#' + newIssue.number + '</a>', true); 
            var issueLabels = new Array();
            $.each(activeIssue.labels, function(key, label) 
            {              
                issueLabels.push(label.name); 
            }); 
            issueLabels.push("Status: IssueMoved");
            github_UpdateIssue($('#selGithubRepositories').val(), activeIssue.number, {state: 'closed', labels: issueLabels }, function(){
                console.log('Source issue closed');
            });
        });
    });

    $("#updateUser").click(function() {
        console.log('update user clicked');
        hideAlert();
        var usertoken = btoa($(txtUsername).val() + ":" + $(txtPassword).val());
        storeUser(usertoken);
        github_configure(usertoken, function  (jqXHR,  textStatus,  errorThrow)
            {
                showAlert(errorThrow, false);
            });

        fillThePageWithGithubData();        
        showHideUserInfoDialog(false);
    });
   
    $( "#showUserDialog" ).button().on( "click", function() {
        showHideUserInfoDialog(true);
    });

});