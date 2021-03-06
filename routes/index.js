var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({
			secret: 'SECRET',
			userProperty: 'payload'
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// Preload post objects on routes with ':post'
router.param('post', function (req, res, next, id) {
  	var query = Post.findById(id);

  	query.exec(function (err, post){
	    if (err) { 
	    	return next(err); 
	    }
	    
	    if (!post) { 
	    	return next(new Error('can\'t find post'));
	    }

    	req.post = post;
    	return next();
	});
});

// Preload comment objects on routes with ':comment'
router.param('comment', function (req, res, next, id) {
	var query = Comment.findById(id);

	query.exec(function (err, comment) {
		if (err) {
			return next(err);
		}

		if (!comment) {
			return next(new Error('can\'t find comment'));
		}

		req.comment = comment;
		return next();
	});
});

router.get('/posts',  function (req, res, next) {
	Post.find(function (err, posts) {
		if (err) {
			return next(err);
		}

		res.json(posts);
	});
});

router.post('/posts', auth, function (req, res, next) {
	var post = new Post(req.body);

	post.author = req.payload.username;

	post.save(function (err, post) {
		if (err) {
			return next(err);
		}

		res.json(post);
	});
});

// Get a post by id
router.get('/posts/:post', function (req, res) {
	req.post.populate('comments', function (err, next) {
		if (err) {
			return next(err);
		}

		res.json(req.post);
	});
});


// Update a post w/ upvote
router.put('/posts/:post/upvote', auth, function (req, res, next) {
  	req.post.upvote(function (err, post) {
	    if (err) {
	    	return next(err);
	    }

    	res.json(post);
  	}, req.payload.username);
});

// Update a post w/ remove upvote
router.put('/posts/:post/removeUpvote', auth, function (req, res, next) {
	req.post.removeUpvote(function (err, post) {
		if (err) {
			return next(err);
		}

		res.json(post);
	}, req.payload.username);
});

// Update a post w/ downvote
router.put('/posts/:post/downvote', auth, function (req, res, next) {
	req.post.downvote(function (err, post) {
		if (err) {
			return next(err);
		}

		res.json(post);
	}, req.payload.username);
});

// Update a post w/ remove downvote
router.put('/posts/:post/removeDownvote', auth, function (req, res, next) {
	req.post.removeDownvote(function (err, post) {
		if (err) {
			return next(err);
		}

		res.json(post);
	}, req.payload.username);
});

// Create a new comment
router.post('/posts/:post/comments', auth, function (req, res, next) {
	var comment = new Comment(req.body);
	
	comment.post = req.post;
	comment.author = req.payload.username;

	comment.save(function (err, comment) {
		if (err) {
			return next(err);
		}

		req.post.comments.push(comment);
		req.post.save(function (err, post) {
			if (err) {
				return next(err);
			}

			res.json(comment);
		});
	});
});

// Update a comment w/ upvote
router.put('/posts/:post/comments/:comment/upvote', auth, function (req, res, next) {
	req.comment.upvote(function (err, comment) {
		if (err) {
			return next(err);
		}

		res.json(comment);
	}, req.payload.username);
});

// Update a comment w/ remove upvote
router.put('/posts/:post/comments/:comment/removeUpvote', auth, function (req, res, next) {
	req.comment.removeUpvote(function (err, comment) {
		if (err) {
			return next(err);
		}

		res.json(comment);
	}, req.payload.username)
});

// Update a comment w/ downvote
router.put('/posts/:post/comments/:comment/downvote', auth, function (req, res, next) {
	req.comment.downvote(function (err, comment) {
		if (err) {
			return next(err);
		}

		res.json(comment);
	}, req.payload.username);
});

// Update a comment w/ remove downvote
router.put('/posts/:post/comments/:comment/removeDownvote', auth, function (req, res, next) {
	req.comment.removeDownvote(function (err, comment) {
		if (err) {
			return next(err);
		}

		res.json(comment);
	}, req.payload.username);
});

// Register as a user
router.post('/register', function (req, res, next) {
	if (!req.body.username || !req.body.password) {
		return res.status(400).json(
					{
						message: 'Please fill out all fields'
					}
		);
	}

	var user = new User();

	user.username = req.body.username;

	user.setPassword(req.body.password);

	user.save(function (err) {
		if (err) {
			return next (err);
		}

		return res.json({
			token: user.generateJWT()
		});
	});
});

// User login
router.post('/login', function (req, res, next) {
	if (!req.body.username || !req.body.password) {
		return res.status(400).json({
			message: 'Please fill out all fields'
		});
	}

	passport.authenticate('local', function (err, user, info) {
		if (err) {
			return next(err);
		}

		if (user) {
			return res.json({
				token: user.generateJWT()
			});
		} else {
			return res.status(401).json(info);
		}
	})(req, res, next);
})

module.exports = router;
