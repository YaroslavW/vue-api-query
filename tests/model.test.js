import Post from './dummy/models/Post'
import User from './dummy/models/User'
import { Model } from '../src'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter';
import { Posts as postsResponse } from './dummy/data/posts'
import { Posts as postsEmbedResponse } from './dummy/data/postsEmbed'
import { Post as postResponse } from './dummy/data/post'
import { Comments as commentsResponse } from './dummy/data/comments'

describe('Model methods', () => {

  let errorModel = {}
  Model.$http = axios
  let axiosMock = new MockAdapter(axios)

  beforeEach(() => {
    axiosMock.reset()
  })

  test('it throws a error when find() has no parameters', () => {
    errorModel = () => {
      const post = Post.find()
    }

    expect(errorModel).toThrow('You must specify the param on find() method.')
  })

  test('first() returns first object in array as instance of such Model', async () => {

    axiosMock.onGet('http://localhost/posts').reply(200, {
      data: postsResponse
    })

    const post = await Post.first()
    expect(post).toEqual(postsResponse[0])
    expect(post).toBeInstanceOf(Post)
  })

  test('first() method returns a empty object when no items have found', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, [])

    const post = await Post.first()
    expect(post).toEqual({})
  })

  test('find() method returns a object as instance of such Model', async () => {
    axiosMock.onGet('http://localhost/posts/1').reply(200, postResponse)

    const post = await Post.find(1)
    expect(post).toEqual(postResponse)
    expect(post).toBeInstanceOf(Post)
  })

  test('get() method returns a array of objects as instace of suchModel', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, postsResponse)

    const posts = await Post.get()

    posts.forEach(post => {
      expect(post).toBeInstanceOf(Post)
    });
  })

  test('$get() fetch style request with "data" attribute', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, postsEmbedResponse)

    const posts = await Post.$get()

    expect(posts).toEqual(postsEmbedResponse.data)

  })

  test('$get() fetch style request without "data" attribute', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, postsEmbedResponse.data)

    const posts = await Post.$get()

    expect(posts).toEqual(postsEmbedResponse.data)

  })

  test('save() method makes a POST request when ID of object does not exists', async () => {
    let post

    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('post')
      expect(config.data).toEqual(JSON.stringify(post))
      expect(config.url).toEqual('http://localhost/posts')

      return [200, {}]
    })

    post = new Post({ title: 'Cool!' })
    await post.save()

  })

  test('save() method makes a PUT request when ID of object exists', async () => {

    let post

    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('put')
      expect(config.data).toEqual(JSON.stringify(post))
      expect(config.url).toEqual('http://localhost/posts/1')

      return [200, {}]
    })

    post = new Post({ id: 1, title: 'Cool!' })
    await post.save()
  })

  test('save() method makes a PUT request when ID of object exists (nested object)', async () => {
    let comment

    axiosMock.onGet('http://localhost/posts/1/comments').reply(200, commentsResponse)

    axiosMock.onPut().reply((config) => {
      expect(config.method).toEqual('put')
      expect(config.data).toEqual(JSON.stringify(comment))
      expect(config.url).toEqual('http://localhost/posts/1/comments/1')

      return [200, {}]
    })

    const post = new Post({ id: 1 })
    comment = await post.comments().first()
    comment.text = 'Owh!'
    comment.save()
  })

  test('a request from delete() method hits the right resource', async () => {

    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('delete')
      expect(config.url).toBe('http://localhost/posts/1')

      return [200, {}]
    })

    const post = new Post({ id: 1 })

    post.delete()
  })

  test('a request from delete() method when model has not ID throws a exception', async () => {

    errorModel = () => {
      let post = new Post()
      post.delete()
    }

    expect(errorModel).toThrow('This model has a empty ID.')
  })

  test('a request from delete() method hits the right resource (nested object)', async () => {
    axiosMock.onGet('http://localhost/posts/1/comments').reply(200, commentsResponse)

    axiosMock.onDelete().reply((config) => {
      expect(config.method).toEqual('delete')
      expect(config.url).toBe('http://localhost/posts/1/comments/1')

      return [200, {}]
    })

    const post = new Post({ id: 1 })
    const comment = await post.comments().first()
    comment.delete()
  })

  test('a request with custom() method hits the right resource', async () => {

    axiosMock.onAny().reply((config) => {
      expect(config.url).toBe('postz')

      return [200, {}]
    })

    const post = await Post.custom('postz').first()
  })

  test('a request from hasMany() method hits right resource', async () => {
    let user
    let posts

    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('get')
      expect(config.url).toEqual('http://localhost/users/1/posts')

      return [200, {}]
    })

    user = new User({ id: 1 })
    posts = await user.posts().get()
  })

  test('a request hasMany() method returns a array of Models', async () => {

    axiosMock.onGet('http://localhost/users/1/posts').reply(200, postsResponse)

    const user = new User({ id: 1 })
    const posts = await user.posts().get()

    posts.forEach(post => {
      expect(post).toBeInstanceOf(Post)
    });
  })

  test('attach() method hits right endpoint with a POST request', async () => {
    let comment

    axiosMock.onPost().reply((config) => {
      expect(config.method).toEqual('post')
      expect(config.data).toEqual(JSON.stringify(comment))
      expect(config.url).toEqual('http://localhost/posts/1/comments')

      return [200, {}]
    })

    const post = new Post({ id: 1 })
    comment = { text: 'hi!' }
    let response = post.comments().attach(comment)
  })

  test('sync() method hits right endpoint with a PUT request', async () => {
    let comment

    axiosMock.onPut().reply((config) => {
      expect(config.method).toEqual('put')
      expect(config.data).toEqual(JSON.stringify(comment))
      expect(config.url).toEqual('http://localhost/posts/1/comments')

      return [200, {}]
    })

    const post = new Post({ id: 1 })
    comment = { text: 'hi!' }
    let response = post.comments().sync(comment)
  })
})