

var converter = new showdown.Converter()
var alertnum = 1
var db = new PouchDB('md')

var createAlert = function(title, message, keep) {
  console.log(title, message, keep)
/*  var num = alertnum++;
  var html = "<div id=\"alert" + num + "\" class=\"alert alert-warning alert-dismissible fade in\" role=\"alert\">\n" +
             "<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">\n" +
             "<span aria-hidden=\"true\">&times;</span></button>\n" +
             "<strong>" + title + "</strong> "+message +
             "</div>";
  $('#alerts').html( $('#alerts').html() + html);
  if(keep && keep===true) {

  } else {
    setTimeout(function() {
      $('#alert' + num).alert('close');
    }, 5000);
  }*/
};

var getTS = function() {
  return Math.round(+new Date()/1000);
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

var getDocList = async function() {
  var retval = { }; 
  try {
    const data = await db.query( map, { descending: true, include_docs:true})
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
    return thedocs
  } catch (err) {
    return err
  }
}

var app = new Vue({
  el: '#app',
  data: {
    markdown: '',
    docName: '',
    lastSaved: '',
    message: 'Hello Vue!',
    showJumbo : true,
    showPreview: true,
    docId: '',
    lastSaved: '',
    docList: []
  },
  computed: {
    convertedMarkdown: function() {
      console.log('here')
      return converter.makeHtml(this.markdown);
    }
  },
  methods: {
    newClicked: function() {
      this.markdown = ''
      this.docName = ''
      this.lastSaved = ''
      createAlert("New Document created", "")
      this.showJumbo = false
      this.docId = ''
      this.lastSaved = ''
      this.docList = []
    },
    saveClicked: async function() {
      if(!this.docId) {
        var uuid4 = UUID.create()
        this.docId = uuid4.toString();
      }
      var doc = {
        doc_id: this.docId,
        doc_name: this.docName,
        body: this.markdown,
        ts: getTS()
      };
      if(doc.doc_name.length === 0) {
        alert("Please name your document before saving it");
        return false;
      }
      const self = this
      await db.post(doc)
      createAlert("Document saved", this.docName); 
      self.lastSaved = doc.body; 
      return false;
    },
    loadClicked: async function() {
      this.docList = await getDocList()
    },
    loadDoc: async function(doc) {
      this.markdown = doc.body
      this.docName = doc.doc_name
      this.showJumbo = false
      this.docId = doc.doc_id
      this.docList = []
    },
    dismissDocListClicked: function() {
      this.docList = []
    }
  }
})
