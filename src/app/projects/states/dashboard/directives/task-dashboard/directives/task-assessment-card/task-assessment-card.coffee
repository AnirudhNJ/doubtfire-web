angular.module('doubtfire.projects.states.dashboard.directives.task-dashboard.directives.task-assessment-card', [])
#
# Shows quality stars and graded task information
#
.directive('taskAssessmentCard', ->
  restrict: 'E'
  templateUrl: 'projects/states/dashboard/directives/task-dashboard/directives/task-assessment-card/task-assessment-card.tpl.html'
  scope:
    task: '='
  controller: ($scope, taskService, gradeService) ->
    # Expose grade names
    $scope.gradeNames = gradeService.grades

    $scope.hasBeenGivenStars = (t) ->
      t.quality_pts > 0 || _.includes(taskService.markedStatuses, t.status)

    $scope.hasBeenGraded = (t) ->
      _.isNumber(t.grade)
)
