/** @fileoverview Angular app for RTA DKT Tests. */

// Namespace.
var dkt = dkt || {};


// Map of test types and their rules.
dkt.test_types = {
  'car': [
    {'name': 'General Knowledge',
     'options': {'max': 15, 'required': 12},
     'topics': ['ICAC', 'CG']},
    {'name': 'Road Safety',
     'options': {'max': 20, 'required': 19},
     'topics': ['AD', 'DR', 'FD', 'IN', 'LD', 'ND', 'PD', 'SB', 'SL', 'TL']},
    {'name': 'Traffic Signs',
     'options': {'max': 10, 'required': 10},
     'topics': ['SI']}
  ]
};


// Placeholder for questions.
dkt.questions = {};


/* Class representing a test.
 * @constructor
 * @param {String} test_type Type of test, also a key into dkt.test_types.
 *    defaults to 'car'.
 */
dkt.test = function(test_type) {
  this.test_type = test_type || 'car';
  this.pool = dkt.questions[this.test_type];
  this.started = false;
  this.finished = false;
  this.paused = false;
  this.questions = [];
  this.current_section = null;
  this.current_question = null;
  this.current_question_index = null;
  this.score = {'total': 0, 'sections': {}};
  this.asked = 0;
  this.setup();
};


/* Pick and randomize questions to be asked on this test. */
dkt.test.prototype.setup = function() {
  var self = this;
  var rules = dkt.test_types[this.test_type];
  rules.forEach(function(section) {
    self.score.sections[section.name] = {
      'score': 0,
      'max': section.options.max,
      'required': section.options.required
    };
    var section_pool = [];
    section.topics.forEach(function(topic){
      var topic_pool = _.map(
          dkt.questions[self.test_type][topic].questions,
          function(v,k) { return [section.name, topic, k];});
      section_pool.push.apply(section_pool, topic_pool);
    });
    self.questions.push.apply(
      self.questions,
      _.first(_.shuffle(section_pool), section.options.max));
  });
};

dkt.test.prototype._getQuestion =function(tuple) {
  return this.pool[tuple[1]].questions[tuple[2]] || null;
};

dkt.test.prototype.start = function() {
  this.started = true;
  this.current_question_index = 0;
  var question = this.questions[this.current_question_index];
  this.current_section = question[0];
  this.current_question = this._getQuestion(question);
  this.asked++;
};

dkt.test.prototype.stop = function() {
  var passed = true;
  _.each(this.score.sections, function(v,k) {
    v.passed = (v.score >= v.required) ? true : false;
    passed = passed && v.passed;
  });
  this.passed = passed;
  this.result = this.passed ? 'PASSED' : 'FAILED';
  this.finished = true;
};

dkt.test.prototype.mark_answer = function(answer) {
var correct_answer = this.current_question.correct_answer || 0;
  if (answer == correct_answer) {
      this.score.total++;
      this.score.sections[this.current_section].score++;
  }
};

dkt.test.prototype.next_question = function() {
  if (this.asked == 45) {
    this.stop();
    return;
  }
  this.current_question_index++;
  var question = this.questions[this.current_question_index];
  this.current_section = question[0];
  this.current_question = this._getQuestion(question);
  this.asked++;
};

dkt.app = angular.module('dkt_app', ['ui.bootstrap']);

dkt.app.service('Backend', ['$http', '$rootScope', function($http, $root) {
  var service = {};
  service.update = function() {
    $http.get('data/car.json').success(function(resp) {
      service.sections = resp;
      dkt.questions['car'] = resp;
      $root.$broadcast('updatedData');
    });
  };
  return service;
}]);


/* Navigation Controller.
 * @param {Object} $scope Angular scope.
 * @param {Object} Backend Injected backend service.
 */
var NavigationController = function($scope, Backend) {
  $scope.sections = null;
  $scope.started = false;
  $scope.progress = 0;
  $scope.$on('updatedData', function() {
    $scope.sections = Backend.sections;
    $scope.test = new dkt.test('car');
  });
  $scope.start = function() { $scope.test.start(); };
  $scope.stop = function() { $scope.test.stop(); };
  $scope.next_question = function() {
    $scope.test.next_question();
    $scope.progress = Math.ceil($scope.test.asked/45 * 100);
    $scope.answered = false;
    $scope.current_answer = null;
    $scope.correct_answer = $scope.test.current_question.correct_answer || 0;
  };
  $scope.select_answer = function(i) {
    if ($scope.answered) return;
    $scope.answered = true;
    $scope.current_answer = i;
    $scope.correct_answer = $scope.test.current_question.correct_answer || 0;
    $scope.test.mark_answer(i);
  };
  $scope.refresh = Backend.update;
  // Initial Refresh.
  $scope.refresh();
};
