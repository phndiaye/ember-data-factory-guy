import FactoryGuy from 'ember-data-factory-guy/factory-guy';
import MissingSequenceError from 'ember-data-factory-guy/missing-sequence-error';
import User from 'dummy/models/user';
import BigHat from 'dummy/models/big-hat';
import SmallHat from 'dummy/models/small-hat';
import Outfit from 'dummy/models/outfit';
import startApp from '../helpers/start-app';


var App,
    make = function() { return FactoryGuy.make.apply(FactoryGuy,arguments); },
    store;


module('FactoryGuy with DS.RESTAdapter', {
  setup: function() {
    App = startApp();
    var restAdapter = App.__container__.lookup('adapter:-rest');
    store = FactoryGuy.getStore();
    store.adapterFor = function() { return restAdapter }
  },
  teardown: function() {
    Ember.run(function() {
      FactoryGuy.resetModels();
      App.destroy();
    });
  }
});


test("#resetModels clears the store of models, and resets the model definition", function() {
  Em.run(function() {
    var project = make('project');
    var user = make('user', {projects: [project]});

    for (var model in FactoryGuy.modelDefinitions) {
      var definition = FactoryGuy.modelDefinitions[model];
      sinon.spy(definition, 'reset');
    }

    FactoryGuy.resetModels();

    equal(store.all('user').get('content.length'), 0)
    equal(store.all('project').get('content.length'), 0)

    for (var model in FactoryGuy.modelDefinitions) {
      var definition = FactoryGuy.modelDefinitions[model];
      ok(definition.reset.calledOnce);
      definition.reset.restore();
    }
  });
});


module('#make with RestAdapter', {
  setup: function() {
    App = startApp();
    var restAdapter = App.__container__.lookup('adapter:-rest');
    store = FactoryGuy.getStore();
    store.adapterFor = function() { return restAdapter }
  },
  teardown: function() {
    Ember.run(function() {
      FactoryGuy.resetModels();
      App.destroy();
    });
  }
});


asyncTest("creates records in the store", function() {
  var user = make('user');
  ok(user instanceof User);

  store.find('user', user.id).then(function(store_user) {
    ok(store_user === user);
    start()
  });
});

test("handles custom attribute type attributes", function() {
  var info = {first:1}
  var user = make('user', {info: info});
  ok(user.get('info') === info)
});

test("makeFixture with fixture options", function() {
  var profile = make('profile',  {description: 'dude'});
  ok(profile.get('description') === 'dude');
});

test("makeFixture with traits", function() {
  var profile = make('profile', 'goofy_description');
  ok(profile.get('description') === 'goofy');
});

test("makeFixture with traits and fixture options ", function() {
  var profile = make('profile', 'goofy_description', {description: 'dude'});
  ok(profile.get('description') === 'dude');
});



test("when hasMany associations assigned, belongTo parent is assigned", function() {
  var project = make('project');
  var user = make('user', {projects: [project]})

  ok(project.get('user') === user);
});


asyncTest("when hasMany ( asnyc ) associations assigned, belongTo parent is assigned", function() {
  var user = make('user');
  var company = make('company', {users: [user]});

  user.get('company').then(function(c){
    ok(c === company);
    start();
  })
});


test("when hasMany ( polymorphic ) associations are assigned, belongTo parent is assigned", function() {
  var bh = make('big-hat');
  var sh = make('small-hat');
  var user = make('user', {hats: [bh, sh]});

  equal(user.get('hats.length'), 2);
  ok(user.get('hats.firstObject') instanceof BigHat)
  ok(user.get('hats.lastObject') instanceof SmallHat)
  // sets the belongTo user association
  ok(bh.get('user') === user)
  ok(sh.get('user') === user)
});


test("when hasMany ( self referential ) associations are assigned, belongsTo parent is assigned", function() {
  var bigGroup = make('big-group');
  var group = make('group', {versions: [bigGroup]});
  ok(bigGroup.get('group') === group)
});


test("when hasMany associations are assigned, belongsTo parent is assigned using inverse", function() {
  var project = make('project');
  var project2 = make('project', {children: [project]});

  ok(project.get('parent') === project2);
});


test("when hasMany associations are assigned, belongsTo parent is assigned using actual belongsTo name", function() {
  var silk = make('silk');
  var bh = make('big-hat', {materials: [silk]});

  ok(silk.get('hat') === bh)
});


test("when hasMany associations are assigned, belongsTo ( polymorphic ) parent is assigned", function() {
  var fluff = make('fluffy-material');
  var bigHat = make('big-hat', {fluffy_materials: [fluff]});

  ok(fluff.get('hat') === bigHat)
});


test("when belongTo parent is assigned, parent adds to hasMany records", function() {
  var user = make('user');
  var project1 = make('project', {user: user});
  var project2 = make('project', {user: user});

  equal(user.get('projects.length'), 2);
  ok(user.get('projects.firstObject') === project1);
  ok(user.get('projects.lastObject') === project2);
});


test("when belongTo parent is assigned, parent adds to polymorphic hasMany records", function() {
  var user = make('user');
  make('big-hat', {user: user});
  make('small-hat', {user: user});

  equal(user.get('hats.length'), 2);
  ok(user.get('hats.firstObject') instanceof BigHat)
  ok(user.get('hats.lastObject') instanceof SmallHat)
});


asyncTest("when hasMany ( async ) relationship is assigned, model relationship is synced on both sides", function() {
  var property = make('property');
  var user1 = make('user', {properties: [property]});
  var user2 = make('user', {properties: [property]});

  equal(property.get('owners.length'), 2);
  ok(property.get('owners.firstObject') === user1);
  ok(property.get('owners.lastObject') === user2);
  start();
});


asyncTest("when belongsTo ( async ) parent is assigned, parent adds to hasMany records", function() {
  var user1 = make('user');
  var user2 = make('user');
  var company = make('company', {users: [user1, user2]});

  equal(company.get('users.length'), 2);
  ok(company.get('users.firstObject') === user1);
  ok(company.get('users.lastObject') === user2);
  start();
});


test("when belongTo parent is assigned, parent adds to hasMany record using inverse", function() {
  var project = make('project');
  var project2 = make('project', {parent: project});

  equal(project.get('children.length'), 1);
  ok(project.get('children.firstObject') === project2);
});


test("when belongTo parent is assigned, parent adds to hasMany record using actual hasMany name", function() {
  var bh = make('big-hat');
  var silk = make('silk', {hat: bh});

  ok(bh.get('materials.firstObject') === silk)
});


test("when belongTo parent is assigned, parent adds to belongsTo record", function() {
  var company = make('company');
  var profile = make('profile', {company: company});
  ok(company.get('profile') === profile);

  // but guard against a situation where a model can belong to itself
  // and do not want to set the belongsTo on this case.
  var hat1 = make('big-hat')
  var hat2 = make('big-hat', {hat: hat1})
  ok(hat1.get('hat') === null);
  ok(hat2.get('hat') === hat1);
});


test("belongsTo associations defined as attributes in fixture", function() {
  var project = make('project_with_user');
  equal(project.get('user') instanceof User, true)
  ok(project.get('user.name') === 'User1');

  var project = make('project_with_dude');
  ok(project.get('user.name') === 'Dude');

  var project = make('project_with_admin');
  ok(project.get('user.name') === 'Admin');
});



test("hasMany associations defined as attributes in fixture", function() {
  var user = make('user_with_projects');
  equal(user.get('projects.length'), 2)
  ok(user.get('projects.firstObject.user') === user)
  ok(user.get('projects.lastObject.user') === user)
})


test("hasMany associations defined with traits", function() {
  var user = make('user', 'with_projects');
  equal(user.get('projects.length'), 2)
  ok(user.get('projects.firstObject.user') === user)
  ok(user.get('projects.lastObject.user') === user)
})

test("belongsTo associations defined with traits", function() {
  var hat1 = make('hat', 'with_user');
  equal(hat1.get('user') instanceof User, true)

  var hat2 = make('hat', 'with_user', 'with_outfit');
  equal(hat2.get('user') instanceof User, true)
  equal(hat2.get('outfit') instanceof Outfit, true)
})


test("with (nested json fixture) belongsTo has a hasMany association which has a belongsTo", function() {
  var project = make('project', 'with_user_having_hats_belonging_to_outfit');
  var user = project.get('user');
  var hats = user.get('hats');
  var firstHat = hats.get('firstObject');
  var lastHat = hats.get('lastObject');

  ok(user.get('projects.firstObject') === project)
  ok(firstHat.get('user') === user)
  ok(firstHat.get('outfit.id') === 1)
  ok(firstHat.get('outfit.hats.length') === 1)
  ok(firstHat.get('outfit.hats.firstObject') === firstHat)

  ok(lastHat.get('user') === user)
  ok(lastHat.get('outfit.id') === 2)
  ok(lastHat.get('outfit.hats.length') === 1)
  ok(lastHat.get('outfit.hats.firstObject') === lastHat)
});


module('#makeList with DS.RESTAdapter', {
  setup: function() {
    App = startApp();
    var restAdapter = App.__container__.lookup('adapter:-rest');
    store = FactoryGuy.getStore();
    store.adapterFor = function() { return restAdapter }
  },
  teardown: function() {
    Ember.run(function() {
      FactoryGuy.resetModels();
      App.destroy();
    });
  }
});


test("creates list of DS.Model instances", function() {
  var users = FactoryGuy.makeList('user', 2);
  equal(users.length, 2);
  ok(users[0] instanceof DS.Model === true);

  var storeUsers = store.all('user').get('content');
  ok(storeUsers[0] === users[0]);
  ok(storeUsers[1] === users[1]);
});

test("handles accept traits", function() {
  var users = FactoryGuy.makeList('user', 2, 'with_hats');
  equal(users.length, 2);
  equal(users[0].get('hats.length') === 2, true);
});

test("handles accept traits and optional fixture arguments", function() {
  var users = FactoryGuy.makeList('user', 2, 'with_hats', {name: 'Bob'});
  equal(users[0].get('name'), 'Bob');
  equal(users[0].get('hats.length') === 2, true);
});
