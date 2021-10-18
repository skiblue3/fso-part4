const config = require('../utils/config')
const jwt = require('jsonwebtoken')
const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogRouter.post('/', async (request, response) => {
  const body = request.body

  if (!body.title || !body.url) {
    return response.status(400).end()
  }

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, config.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)

  const blog = new Blog({
    title: body.title,
    author: body.author || 'none',
    url: body.url,
    likes: body.likes || 0,
    user: user._id
  })

  const savedBlog = await blog.save()
  console.log('check1')
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
  console.log('check2')

  response.json(savedBlog)
})

blogRouter.delete('/:id', async (request, response) => {
  const id = request.params.id
  await Blog.findByIdAndRemove(id)
  response.status(204).end()
})

blogRouter.put('/:id', async (request, response) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  }

  const updatedNote = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.json(updatedNote)
})

module.exports = blogRouter