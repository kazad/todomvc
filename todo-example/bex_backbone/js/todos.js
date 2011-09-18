$(function() {
	
	/* utility method for cross-domain communication */
	
	function crossDomainPost(url, data) {
	  // Add the iframe with a unique name
	  var iframe = document.createElement("iframe");
	  var uniqueString = "BEX_CROSS_DOMAIN";
	  document.body.appendChild(iframe);
	  iframe.style.display = "none";
	  iframe.contentWindow.name = uniqueString;

	  // construct a form with hidden inputs, targeting the iframe
	  var form = document.createElement("form");
	  form.target = uniqueString;
	  form.action = url;
	  form.method = "POST";

		// repeat for each parameter
		if (data) {
			var input = document.createElement("input");
			input.type = "hidden";
			input.name = data[0].name;
			input.value = data[0].value;
			form.appendChild(input);
		}
	
		document.body.appendChild(form);
		form.submit();
	}

	/* BetterExplained Aha! App */

	window.Aha = Backbone.Model.extend({
		defaults: {},
				
		initialize: function() {},
		
		//  not a pre-initialize function... add some extra data for the view
		setup: function() {
			var post = this.get('post');
			post.truncated_title = this.truncated_title();
			this.set({'post':post});
		},
		
		truncated_title: function(){
			return this.get('post').title.replace(/^\w+[:]\s+/, '');
		}
	});

	window.AhaList = Backbone.Collection.extend({
		model: Aha,
		
		// default to all ahas for the current URL
		params: '',
		
		url: function() {
			// TODO: get the url from the current document.location & include any extra filtering options
			return 'http://localhost:3000/posts.json?' + this.params + '&callback=?';
		},
		
		initialize: function(params) {

		}
	});
	
	window.AhaView = Backbone.View.extend({
	    tagName:  "li",
	    template: _.template($('#item-template').html()),
	    events: {
			'click .upvote' : 'upvote'
		 },

	    initialize: function() {
	      _.bindAll(this, 'render');
	      this.model.bind('change', this.render);
	      this.model.view = this;
	    },
	
		upvote: function() {
			var url = 'http://localhost:3000/posts/' + this.model.get('post').id + '/rate?rating=1&background=1';
			crossDomainPost(url);
			return false;
		},

	    // Re-render the contents of the todo item.
	    render: function() {
	      $(this.el).html(this.template(this.model.toJSON()));
	      return this;
	    },
	});

	// Our overall **AppView** is the top-level piece of UI.	
	window.AppView = Backbone.View.extend({
		el: null,
		events: {},
		template: null,

		initialize: function() {
			_.bindAll(this, 'addOne', 'addAll', 'render');

			// fetch the data for this view
			var Ahas = new AhaList();

			Ahas.bind('add', this.addOne);
			Ahas.bind('reset', this.addAll);
			Ahas.bind('all', this.render);
			
			// setup initial template
			this.template = _.template($('#' + this.el.attr('data-app-template')).html());
			this.el.html(this.template());
			
			// configure search params
			Ahas.params = this.el.attr('data-params');
			
			Ahas.fetch();
			
			this.collection = Ahas;
		},

		addOne: function(aha) {
			// TODO: ugly... not sure why setup happens here. Why not after fetch?
			aha.setup();
			
			var view = new AhaView({model: aha});
			this.$("#aha-list").append(view.render().el);
	    },

	    // Add all items in the **Todos** collection at once.
	    addAll: function() {
	      this.collection.each(this.addOne);
	    },

		render: function() {

		},
	});
	
	// Finally, we kick things off by creating the **App**.
	$('.bex-aha').each(function(){ 
		window.AhaApp = new AppView({el: $(this)});
	});
});
