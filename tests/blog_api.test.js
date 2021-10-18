const config = require('../utils/config')
const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('../models/user')
let token = ''

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)
  const newUser = new User({ username: 'root', name: 'superuser', passwordHash })
  await newUser.save()

  const initialBlogs= [
    {
      title: 'React patterns',
      author: 'Michael Chan',
      url: 'https://reactpatterns.com/',
      likes: 7,
      user: newUser._id
    },
    {
      title: 'Go To Statement Considered Harmful',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
      likes: 5,
      user: newUser._id
    }
  ]

  let blogObject = new Blog(initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(initialBlogs[1])
  await blogObject.save()

  const response = await api
    .post('/api/login')
    .send({ username: 'root', password: 'sekret' })

  token = response.body.token
})

describe('when there is initially some blogs are saved', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('all blogs are returned got id property', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body[0].id).toBeDefined()
  })
})

describe ('addition of new blog', () => {
  test('a valid blog can be added', async () => {

    const user = await User.findById(jwt.verify(token, config.SECRET).id)

    const newBlog = {
      title: 'First class tests',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
      likes: 10,
      user: user._id
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const titles = blogsAtEnd.map(r => r.title)

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
    expect(titles).toContain(
      'First class tests'
    )
  })

  test('a blog without likes added will be displayed with 0 likes', async () => {

    const user = await User.findById(jwt.verify(token, config.SECRET).id)

    const newBlog = {
      title: 'No likes HEHE',
      author: 'Ronaldo C.',
      url: 'http://blog.com/it-doesnt-work',
      user: user._id
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(200)

    const blogsAtEnd = await helper.blogsInDb()
    const findLast = blogsAtEnd.find(r => r.title === 'No likes HEHE')

    expect(findLast.likes).toBe(0)
  })

  test('a blog without title or url returns 400', async () => {
    const user = await User.findById(jwt.verify(token, config.SECRET).id)

    const newBlog = {
      title: 'No url',
      author: 'idk maybe u',
      user: user._id
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('blog with invalid token doesn\'t gets added', async () => {
    const user = await User.findOne({ username: 'root' })

    const newBlog = {
      title: 'First class test111s',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
      likes: 10,
      user: user._id
    }

    await api
      .post('/api/blogs')
      .set('Authorization', 'bearer 111')
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length )
  })
})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map(b => b.title)
    expect(titles).not.toContain(blogToDelete.title)
  })
})

describe('updating blog', () => {
  test('check for the updated blog', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const oldBlog = blogsAtStart[0]
    const newBlog = {
      ...oldBlog,
      likes: oldBlog.likes + 2,
    }

    await api
      .put(`/api/blogs/${newBlog.id}`)
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(200)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toContainEqual(newBlog)
  })
})

afterAll(done => {
  mongoose.connection.close()
  done()
})