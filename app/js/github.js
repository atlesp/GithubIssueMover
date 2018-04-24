
var baseurl =  "https://api.github.com";

function github_configure(token, errorCallback){
  $.ajaxSetup({
    beforeSend:  function (xhr) {
        xhr.setRequestHeader ("Authorization", "Basic " +  token);
        xhr.setRequestHeader ("Accept", "application/vnd.github.v3.full+json");
    },
    error: errorCallback
    
  });
  console.log( "Github configured");
}


function github_getOrganisations(callbackFunction) {

  var url = baseurl + '/user/orgs'

  $.get( url, callbackFunction);

}


function github_getRepositoriesForOrganisation(organisation, callbackFunction) {

  var url = baseurl + '/orgs/' + organisation + '/repos'
  $.get(url, callbackFunction);

}

function github_getRepositories(callbackFunction) {

  var url = baseurl + '/user/repos'
  $.get(url, callbackFunction);

}

function github_getRepositorieMilestones(repoFullname, callbackFunction) {

  var url = baseurl + '/repos/' + repoFullname + '/milestones';
  $.get(url, callbackFunction);

}

function github_getRepositoryLabels(repoFullname, callbackFunction) {

  var url = baseurl + '/repos/' + repoFullname + '/labels';
  $.get(url, callbackFunction);

}


function github_CopyIssue(repoFullname, newIssue, milestone, callbackFunction) {

  var url = baseurl + '/repos/' + repoFullname + '/issues';
  
  var assignees = new Array();
  $.each(newIssue.assignees, function(key, assignee) 
  {
    assignees.push(assignee.login);
  }); 

  github_getRepositoryLabels(repoFullname, function (repoLabels){
    var issueLabels = new Array();
    $.each(newIssue.labels, function(key, label) 
    {
      if(repoLabels.find(repoLabel => repoLabel.name === label.name) !== undefined ) {
        issueLabels.push(label.name);
      }
    }); 

    var payload = {
      title: newIssue.title,
      body: newIssue.body,
      assignees: assignees,
      labels: issueLabels,
    };
    
    if(milestone !== '0' ){
      payload.milestone = milestone
    }

    $.post(url,
          JSON.stringify(payload), 
          callbackFunction
        );
  });
}


function github_UpdateIssue(repoFullname, issueId, issueData, callbackFunction) {

  var url = baseurl + '/repos/' + repoFullname + '/issues/' + issueId;
  /*
    var payload = {
      title: newIssue.title,
      body: newIssue.body,
      assignees: assignees,
      labels: issueLabels,
    };
    */
 
    $.post(url,
          JSON.stringify(issueData), 
          callbackFunction
        );
  
}



function github_getIssue(repoFullname, id, callbackFunction) {
    var url = baseurl + '/repos/' + repoFullname + '/issues/' + id
    $.get( url, callbackFunction);
}

