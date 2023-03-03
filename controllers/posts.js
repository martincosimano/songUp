const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { getApiToken, searchTrack } = require("../services/spotify");
const User = require("../models/User");


// Post controller functions
module.exports = {
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      const limit = 3;
      const posts = await Post.find({ user: req.params.id }).sort({ createdAt: "desc" }).limit(limit).lean();
      res.render("profile.ejs", { posts: posts, user: user, flash: req.flash() });
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { posts: posts });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      const comments = await Comment.find({post: req.params.id}).sort({ createdAt: "desc"}).lean();
      const relatedPosts = await Post.find({
        $or: [
          { songName: post.songName },
          { artistName: post.artistName },
        ],
      }).sort({ createdAt: "desc"}).limit(3);
      res.render("post.ejs", {
        post: post,
        user: req.user,
        relatedPosts: relatedPosts,
        comments: comments,
      });
    } catch (err) {
      console.log(err);
    }
  },
  getUserFeed: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id }).sort({ createdAt: "desc" }).lean();
      res.render("profile/userfeed.ejs", { posts: posts });
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
        const { songName, artistName, title, caption } = req.body;

        // Check if the required fields are filled in
        if (!title) {
            throw new Error('Title is required');
        }else if(!caption) {
          throw new Error('Caption is required')
        }else if(!songName) {
          throw new Error('Song name is required')
        }else if(!artistName){
          throw new Error('Artist name is required')
        }

        const token = await getApiToken();
        const trackData = await searchTrack(songName, artistName, token);

        if (!trackData?.tracks?.items?.length) {
            throw new Error('No track data found for this song and artist');
        }

        const post = await Post.create({
            title,
            caption,
            likes: 0,
            songName,
            artistName,
            spotifyTrackId: trackData.tracks.items[0].id,
            user: req.user?.id,
            userName: req.user?.userName,
            email: req.user?.email,
        });

        console.log('Post has been added!');
        res.redirect('/profile/:id');
    } catch (err) {
        console.log(err);

        // Set a flash message to display the error on the profile page
        req.flash('error', err.message);

        // Redirect to the profile page
        res.redirect('/profile/:id');
    }
},
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      let post = await Post.findById({ _id: req.params.id });
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile/:id");
    } catch (err) {
      res.redirect("/profile/:id");
    }
  }
};