// Script de test pour vérifier le contrôleur et le modèle des posts
const PostController = require('./controllers/posts');
const Post = require('./models/Post');

// Vérifier que le modèle est correctement exporté
console.log('Post model methods:', {
  getAllPublic: typeof Post.getAllPublic === 'function',
  getById: typeof Post.getById === 'function',
  getByUser: typeof Post.getByUser === 'function',
  create: typeof Post.create === 'function',
  update: typeof Post.update === 'function',
  delete: typeof Post.delete === 'function',
  updateTtsStatus: typeof Post.updateTtsStatus === 'function',
  search: typeof Post.search === 'function'
});

// Vérifier que le contrôleur est correctement exporté
console.log('PostController methods:', {
  getPosts: typeof PostController.getPosts === 'function',
  getPostById: typeof PostController.getPostById === 'function',
  getUserPosts: typeof PostController.getUserPosts === 'function',
  createPost: typeof PostController.createPost === 'function',
  updatePost: typeof PostController.updatePost === 'function',
  deletePost: typeof PostController.deletePost === 'function',
  searchPosts: typeof PostController.searchPosts === 'function'
});

console.log('Test terminé'); 