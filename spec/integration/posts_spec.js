const request = require("request");
const server = require("../../src/server");
const base = "http://localhost:3000/topics";

const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;
const Post = require("../../src/db/models").Post;
const User = require("../../src/db/models").User;


describe("routes : posts", () => {

  beforeEach((done) => {
     this.topic;
     this.post;
     this.user;
     sequelize.sync({force: true}).then((res) => {
       User.create({
         email: "starman@tesla.com",
         password: "Trekkie4lyfe"
       })
       .then((user) => {
         this.user = user;
         Topic.create({
           title: "Winter Games",
           description: "Post your Winter Games stories.",
           posts: [{
             title: "Snowball Fighting",
             body: "So much snow!",
             userId: this.user.id
           }]
         }, {
           include: {
            model: Post,
            as: "posts"
           }
         })
         .then((topic) => {
           this.topic = topic;
           this.post = topic.posts[0];
           done();
         })
       })
     });
   });

  describe("admin user performing CRUD actions for Topic", () => {

    beforeEach((done) => {
       User.create({
         email: "admin@example.com",
         password: "123456",
         role: "admin"
       })
       .then((user) => {
        
        request.get({     
            // mock authentication
           url: "http://localhost:3000/auth/fake",
           form: {
             role: user.role,     // mock authenticate as admin user
             userId: user.id,
             email: user.email
           }
         },
           (err, res, body) => {

             done();
           }
         );
       });
     });
  describe("GET /topics/:topicId/posts/new", () => {
    it("should render a new post form", (done) => {
      request.get(`${base}/${this.topic.id}/posts/new`, (err, res, body) => {
        expect(err).toBeNull();
        expect(body).toContain("New Post");
        done();
      });
    });
  });

   describe("POST /topics/:topicId/posts/create", () => {
     it("should create a new post and redirect", (done) => {
        const options = {
          url: `${base}/${this.topic.id}/posts/create`,
          form: {
            title: "Watching snow melt",
            body: "Without a doubt my favoriting things to do besides watching paint dry!"
          }
        };
        request.post(options,
          (err, res, body) => {
            Post.findOne({where: {title: "Watching snow melt"}})
            .then((post) => {
              expect(post).not.toBeNull();
              expect(post.title).toBe("Watching snow melt");
              expect(post.body).toBe("Without a doubt my favoriting things to do besides watching paint dry!");
              expect(post.topicId).not.toBeNull();
              done();
            })
            .catch((err) => {
              console.log(err);
              done();
            });
          }
        );
      });
     it("should not create a new post that fails validations", (done) => {
       const options = {
         url: `${base}/${this.topic.id}/posts/create`,
         form: {
           title: "a",
           body: "b"
         }
       };

       request.post(options,
         (err, res, body) => {
           Post.findOne({where: {title: "a"}})
           .then((post) => {
               expect(post).toBeNull();
               done();
           })
           .catch((err) => {
             console.log(err);
             done();
           });
         }
       );
     });
   });

   describe("GET /topics/:topicId/posts/:id", () => {
     it("should render a view with the selected post", (done) => {
       request.get(`${base}/${this.topic.id}/posts/${this.post.id}`, (err, res, body) => {
         expect(err).toBeNull();
         expect(body).toContain("Snowball Fighting");
         done();
       });
     });
   });

   describe("POST /topics/:topicId/posts/:id/destroy", () => {
     it("should delete the post with the associated ID", (done) => {
       expect(this.post.id).toBe(1);
       request.post(`${base}/${this.topic.id}/posts/${this.post.id}/destroy`, (err, res, body) => {
         Post.findById(1)
         .then((post) => {
           expect(err).toBeNull();
           expect(post).toBeNull();
           done();
         })
       });
     });
   });

   describe("GET /topics/:topicId/posts/:id/edit", () => {
     it("should render a view with an edit post form", (done) => {
       request.get(`${base}/${this.topic.id}/posts/${this.post.id}/edit`, (err, res, body) => {
         expect(err).toBeNull();
         expect(body).toContain("Edit Post");
         expect(body).toContain("Snowball Fighting");
         done();
       });
     });
   });

   describe("POST /topics/:topicId/posts/:id/update", () => {
     it("should return a status code 302", (done) => {
       request.post({
         url: `${base}/${this.topic.id}/posts/${this.post.id}/update`,
         form: {
           title: "Snowman Building Competition",
           body: "I love watching them melt slowly."
         }
       }, (err, res, body) => {
         expect(res.statusCode).toBe(302);
         done();
       });
     });
     it("should update the post with the given values", (done) => {
         const options = {
           url: `${base}/${this.topic.id}/posts/${this.post.id}/update`,
           form: {
             title: "Snowman Building Competition",
             body: "I love watching them melt slowly."
           }
         };
         request.post(options,
           (err, res, body) => {
           expect(err).toBeNull();
           Post.findOne({
             where: {id: this.post.id}
           })
           .then((post) => {
             expect(post.title).toBe("Snowman Building Competition");
             done();
           });
         });
     });
   });
  });

describe("member user performing CRUD actions for Post", () => {

    beforeEach((done) => {  // before each suite in admin context
      request.get({
        url: "http://localhost:3000/auth/fake",
        form: {
          role: "member"
        }
      });
      done();
    });

  describe("GET /topics/:topicId/posts/new", () => {
    it("should render a new post form", (done) => {
      request.get(`${base}/${this.topic.id}/posts/new`, (err, res, body) => {
        expect(err).toBeNull();
        expect(body).toContain("New Post");
        done();
      });
    });
  });

   describe("POST /topics/:topicId/posts/create", () => {
     it("should create a new post and redirect", (done) => {
        const options = {
          url: `${base}/${this.topic.id}/posts/create`,
          form: {
            title: "Watching snow melt",
            body: "Without a doubt my favoriting things to do besides watching paint dry!"
          }
        };
        request.post(options,
          (err, res, body) => {
            Post.findOne({where: {title: "Watching snow melt"}})
            .then((post) => {
              //expect(post).not.toBe(false);
              expect(post.title).toBe("Watching snow melt");
              expect(post.body).toBe("Without a doubt my favoriting things to do besides watching paint dry!");
              expect(post.topicId).not.toBeNull();
              done();
            })
            .catch((err) => {
              console.log(err);
              done();
            });
          }
        );
      });
     it("should not create a new post that fails validations", (done) => {
       const options = {
         url: `${base}/${this.topic.id}/posts/create`,
         form: {
           title: "a",
           body: "b"
         }
       };
       request.post(options,
         (err, res, body) => {
           Post.findOne({where: {title: "a"}})
           .then((post) => {
               expect(post).toBeNull();
               done();
           })
           .catch((err) => {
             console.log(err);
             done();
           });
         }
       );
     });
   });

   describe("GET /topics/:topicId/posts/:id", () => {
     it("should render a view with the selected post", (done) => {
       request.get(`${base}/${this.topic.id}/posts/${this.post.id}`, (err, res, body) => {
         expect(err).toBeNull();
         expect(body).toContain("Snowball Fighting");
         done();
       });
     });
   });

   describe("POST /topics/:topicId/posts/:id/destroy", () => {
     it("should not delete the post with the associated ID", (done) => {
      Post.all()
        .then((posts) => {
          const postCountBeforeDelete = posts.length;
          expect(postCountBeforeDelete).toBe(1);
          request.post(`${base}/${this.topic.id}/posts/${this.post.id}/destroy`, (err, res, body) => {
            Post.all()
            .then((posts) => {
              expect(posts.length).toBe(postCountBeforeDelete);
              done();
            })
          });
        })
     });
   });

   describe("GET /topics/:topicId/posts/:id/edit", () => {
     it("should not render a view with an edit post form", (done) => {
       request.get(`${base}/${this.topic.id}/posts/${this.post.id}/edit`, (err, res, body) => {
         expect(err).toBeNull();
         expect(body).not.toContain("Edit Post");
         expect(body).toContain("Snowball Fighting");
         done();
       });
     });
   });

   describe("POST /topics/:topicId/posts/:id/update", () => {
     it("should not update the post with the given values", (done) => {
         const options = {
           url: `${base}/${this.topic.id}/posts/${this.post.id}/update`,
           form: {
             title: "Snowman Building Competition",
             body: "I love watching them melt slowly."
           }
         };
         request.post(options,
           (err, res, body) => {
           expect(err).toBeNull();
           Post.findOne({
             where: {id: this.post.id}
           })
           .then((post) => {
             expect(post.title).toBe("Snowball Fighting"); // confirm title is unchanged
             done();
           });
         });
     });
   });
  });
 });