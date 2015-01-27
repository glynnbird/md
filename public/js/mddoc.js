
var db = new PouchDB("md");
var config = new PouchDB("config");
var doc_id = null;
var last_saved = "";
var alertnum=1;

var getTS = function() {
  return Math.round(+new Date()/1000);
};

var saveDoc = function() {
  if(doc_id === null) {
    var uuid4 = UUID.create()
    doc_id = uuid4.toString();
  }
  var doc = {
    doc_id: doc_id,
    doc_name: $('#doc_name').val(),
    body: $('#themarkdown').val(),
    ts: getTS()
  };
  if(doc.doc_name.length==0) {
    alert("Please name your document before saving it");
    return false;
  }
  db.post(doc, function(err, data) {
     createAlert("Document saved", doc.doc_name); 
     last_saved = doc.body; 
     markdownChanged();
  });
  return false;
};

var map = function(doc) {
  if(doc.doc_id) {
    emit(doc.ts, null);
  }
};

var map2 = function(doc) {
  if(doc.doc_id) {
    emit(doc.doc_id, doc._rev);
  }
};

var getDocList = function(callback) {
  var retval = { }; 
  db.query( map, { descending: true, include_docs:true}, function(err, data) {
    if(err) {
      callback(err, data);
      return;
    }
    for(var i in data.rows) {
      var doc = data.rows[i].doc;
      if(Object.keys(retval).indexOf(doc.doc_id) == -1) {
        retval[doc.doc_id] = doc;
      }
    }
    var thedocs = []
    for(var i in retval) {
      thedocs.push(retval[i]);
    }
    thedocs.sort(function(a, b){return b.ts-a.ts});
    callback(err, thedocs);
  })
};

var loadDoc = function(id) {
  db.get(id, function(err, data){
    if(err) {
      alert("Non-existant document!", id);
      return
    }
    $('#themarkdown').val(data.body);
    $('#doc_name').val(data.doc_name);
    doc_id = data.doc_id;
    last_saved = data.body;
    markdownChanged();
    $('#loadmodal').modal('hide');
    createAlert("Document loaded", data.doc_name);  
  })  
}

var newClicked = function() {
  $('#themarkdown').val("");
  doc_id = null;
  $('#doc_name').val("");
  last_saved="";
  markdownChanged();
  createAlert("New Document created", "");
};

var loadClicked = function() {
  $('#mydocuments').html("");
  $('#loadmodal').modal({show: true});
  getDocList(function(err, docs) {
    var html = "";
    for(var i in docs) {
      html += "<tr>\n";
      html += "<td><a href=\"Javascript:loadDoc('"+docs[i]._id+"')\">" + docs[i].doc_name + "</a></td>\n";
      html += "<td><button type=\"button\" class=\"btn btn-info\" aria-label=\"History\" onclick=\"historyClicked('" + docs[i].doc_id + "')\">\n";
      html += "<span class=\"glyphicon glyphicon glyphicon-sort-by-attributes-alt\" aria-hidden=\"true\"></span> History</button></td>\n";
      html += "<td><button type=\"button\" class=\"btn btn-danger\" aria-label=\"Delete\" onclick=\"deleteClicked('" + docs[i].doc_id + "')\">\n";
      html += "<span class=\"glyphicon glyphicon glyphicon glyphicon-remove\" aria-hidden=\"true\"></span> Delete</button></td>\n";
      
      
      html += "</tr>";
    }
    $('#mydocuments').html(html);
  })
};

var settingsClicked = function() {
  getSyncConfig(function(err, data) {
    if(data) {
      $('#cloudanturl').val(data);
    }
    $('#settingsmodal').modal({show: true});
  });
};


var settingsSubmit = function() {
  var url = $('#cloudanturl').val();
  console.log(url);
  saveSyncConfig(url);
  initiateSync(url);
  return false;
};

var initiateSync = function(url) {
  console.log("initiating sync", url)
  db.sync(url);
}

var saveSyncConfig = function(url) {
  var docname = "config";
  config.get(docname, function(err, data) {
    var doc = {url : url}
    if(!err) {
      doc = data;
      doc.url = url;
    }
    config.put({url: url}, docname, function(err, data) {
      console.log("written config", err, data);
      $('#settingsmodal').modal('hide');
    });
  });
};

var getSyncConfig = function(callback) {
  config.get("config", function(err, data) {
    callback(err, (data)?data.url:null);
  });
};

var createAlert = function(title, message) {
  var num = alertnum++;
  var html = "<div id=\"alert" + num + "\" class=\"alert alert-warning alert-dismissible fade in\" role=\"alert\">\n" +
             "<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">\n" +
             "<span aria-hidden=\"true\">&times;</span></button>\n" +
             "<strong>" + title + "</strong> "+message +
             "</div>";
  $('#alerts').html( $('#alerts').html() + html);
  setTimeout(function() {
    $('#alert' + num).alert('close');
  }, 5000);
};

var historyClicked = function(id) {
  console.log("HISTORY", id);
  alert("History is saved, but I haven't got round to doing this bit yet!");
};


var deleteClicked = function(id) {
  console.log("DELETE", id);
  db.query(map2, { key: id}, function(err, data) {
    console.log(data);
    if(!err) {
      var arr = [ ]
      for(var i in data.rows) {
        var obj = { _deleted: true, _id: data.rows[i].id, _rev: data.rows[i].value };
        arr.push(obj); 
      }
      db.bulkDocs(arr, function(err, data) {
        loadClicked();
      });
    }
  })
};

var markdownChanged = function() {
  var md_content = $('#themarkdown').val();
  var html = markdown.toHTML( md_content );
  $('#rendered').html(html);
  if(md_content != last_saved) {

    $('#savebtn').addClass('btn-danger');
    $('#savebtn').removeClass('btn-default');
    
  } else {
    $('#savebtn').addClass('btn-default');
    $('#savebtn').removeClass('btn-danger');
  }
};

$( document ).ready(function() {
  // Handler for .ready() called.
  getSyncConfig(function(err, data) {
    console.log("sync data", err, data);
    if(data && data.length>0) {
      initiateSync(data);
    }
  })
});

