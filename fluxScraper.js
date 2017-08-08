// dates must be in yyyy-mm-dd format

var team_stats = new Object({})
var team = []

function scrapeStatsFrom(fromDate, toDate) {
  fromDate = new Date(fromDate)
  toDate = new Date(toDate)

  getTeam()
  getTeamTasks()

  for(i = 0; i < team.length; i++){
    getTotalVelocity(team[i])
    getTicketIds(team[i])
    getVelocityForRange(fromDate, toDate, team[i])
  }
}

function getTeam() {
  tasks = $('.accepted-sidebar__inner > .task-card') // for accepted tasks
  // tasks = $('.planning-board__completed > .scroll > .state-column > .task-card') // for completed tasks

  for(i = 0; i <= tasks.length; i++) {
    user = $(tasks[i]).find('.user').text().trim()
    if(user.length == 0) { continue; }
    team.push(user)
  }

  team = Array.from(new Set(team))
}

function getTeamTasks() {
  accepted_tasks = $('.accepted-sidebar__inner > .task-card')

  for(var i = 0; i <= team.length; i++) {
    if (team[i] == undefined) { continue; }
    if (team[i].length == 0) { continue; }
    team_stats[team[i]] = {tickets_in_range: 0, total_velocity: 0, velocity_in_range: 0, ticket_ids: [], tasks: []}
    team_stats[team[i]].tasks = $(accepted_tasks).find(`.user:contains(${team[i]})`).closest('.task-card')
  }
}

function getTotalVelocity(member) {
  for(var x = 0; x <= team_stats[member].tasks.length; x++) {
    if (team_stats[member].tasks[x] == undefined) { continue; }
    if (x < team_stats[member].tasks.length) {
      if ($(team_stats[member].tasks[x]).find('.level-of-effort').text().trim() == '') {
        team_stats[member].total_velocity += 0
      } else {
        team_stats[member].total_velocity += parseInt($(team_stats[member].tasks[x]).find('.level-of-effort').text().trim())
      }
    }
  }
}

function getTicketIds(member) {
  for(var x = 0; x <= team_stats[member].tasks.length; x++) {
    if (team_stats[member].tasks[x] == undefined) {continue;}
    team_stats[member].ticket_ids.push(team_stats[member].tasks[x].attributes['task-card'].value)
  }
}

function getVelocityForRange(fromDate, toDate, member) {
  for(var x = 0; x <= team_stats[member].ticket_ids.length; x++) {
    get(fromDate, toDate, team_stats[member].ticket_ids[x], member, x)
  }
}

function get(fromDate, toDate, ticket_id, member, index) {
  if (ticket_id == undefined) { return; }
  url = `https://m6.metova.com/planning/cas/237/${ticket_id}?only=versions`
  $.get(url, function(resp) {
    console.log('got ', ticket_id, ' info for ', member)
    parser = new DOMParser();
    last_log = $(parser.parseFromString(resp, 'text/html')).find('.versions__item__text:last').text().trim()

    if(last_log != undefined) {
      date = last_log.split(" moved this task from completed to accepted on ")[1]
      if (date != undefined) {
        completedAt = new Date(date)

        if (team_stats[member] != undefined && (completedAt >= fromDate && completedAt <= toDate)) {
          if (index < team_stats[member].tasks.length) {
            team_stats[member].tickets_in_range += 1
            if ($(team_stats[member].tasks[index]).find('.level-of-effort').text().trim() == '') {
              team_stats[member].velocity_in_range += 0
            } else {
              team_stats[member].velocity_in_range += parseInt($(team_stats[member].tasks[index]).find('.level-of-effort').text().trim())
            }
          }
        }
      }
    }
  })
}
