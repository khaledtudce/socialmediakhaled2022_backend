const Post = require("../models/Post");
const User = require("../models/User");
const router = require("express").Router();

// create post
router.post("/create", async (req, res) => {
  try {
    const newPost = new Post({
      userId: req.body.userId,
      desc: req.body.desc,
      img: req.body.img,
    });

    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (error) {
    res.status(500).json(error);
  }
});

// update post
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.params.id) {
      await post.updateOne(req.params.id, {
        $set: req.body,
      });
      res.status(200).json("Your post is successfully updated");
    } else {
      res.status(403).json("You can update only your posts");
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// delete post
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.params.id) {
      await post.deleteOne(req.params.id, {});
      res.status(200).json("Your post is successfully deleted");
    } else {
      res.status(403).json("You can delete only your posts");
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// like/dislike post
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      console.log(req.body.userId);
      res.status(200).json("Successfully liked the post");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("Successfully disliked the post");
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// get post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json(error);
  }
});

// get users all posts
router.get("/profile/:username", async (req, res) => {
  try {
    const currentUser = await User.findOne({ username: req.params.username });
    const currentUserPosts = await Post.find({ userId: currentUser._id });
    res.status(200).json(currentUserPosts);
  } catch (error) {
    res.status(500).json(error);
  }
});

// get timeline posts (my posts and posts to whom I follow)
router.get("/timeline/:userId", async (req, res) => {
  try {
    const currentUser = await User.findOne({ _id: req.params.userId });
    const currentUserPosts = await Post.find({ userId: currentUser._id });
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    res.status(200).json(currentUserPosts.concat(...friendPosts));
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
