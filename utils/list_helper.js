const lodash = require('lodash')

// eslint-disable-next-line no-unused-vars
const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => blog.likes + sum, 0)
}

const favoriteBlog = (blogs) => {
  if(blogs.length === 0) {
    return null
  }

  let min = blogs[0]
  blogs.forEach(blog => {
    if(blog.likes > min.likes)
      min = blog
  })

  return min
}

const mostBlogs = (blogs) => {
  if(blogs.length === 0) {
    return null
  }

  let authors = []
  blogs.forEach(blog => {
    if (!lodash.find(authors, { 'author' :  blog.author })) {
      authors = authors.concat({ 'author': blog.author, 'blogs': 1 })
    }
    else {
      lodash.find(authors, { 'author': blog.author }).blogs += 1
    }
  })

  let max = authors[0]
  authors.forEach(author => {
    if(author.blogs > max.blogs)
      max = author
  })

  return max
}

const mostLikes = (blogs) => {
  if(blogs.length === 0) {
    return null
  }

  let authors = []
  blogs.forEach(blog => {
    if (!lodash.find(authors, { 'author' :  blog.author })) {
      authors = authors.concat({ 'author': blog.author, 'likes': blog.likes })
    }
    else {
      lodash.find(authors, { 'author': blog.author }).likes += blog.likes
    }
  })

  let max = authors[0]
  authors.forEach(author => {
    if(author.likes > max.likes)
      max = author
  })

  return max
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}

