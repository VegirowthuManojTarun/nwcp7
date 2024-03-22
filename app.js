const express = require('express')
const path = require('path')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

app.use(express.json())
let db = null

const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}
initDbAndServer()

//api1
app.get('/players/', async (request, response) => {
  const getplayersQuery = `
        SELECT * 
        FROM player_details
    ;`
  let players = await db.all(getplayersQuery)
  const format = players => {
    return {
      playerId: players.player_id,
      playerName: players.player_name,
    }
  }
  response.send(players.map(eachplayer => format(eachplayer)))
})

//api2
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getRequiredplayerQuery = `
        SELECT * 
        FROM player_details
        WHERE player_id = ${playerId}
    ;`
  let player = await db.get(getRequiredplayerQuery)

  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  })
})

//api3
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerInfo = request.body
  const {playerName} = playerInfo
  console.log(playerName)

  const updatePlayerQuery = `
    UPDATE player_details
    SET
      player_name = '${playerName}'
    WHERE
      player_id = ${playerId};
  `
  await db.get(updatePlayerQuery)
  response.send('Player Details Updated')
  // return 'Player Details Updated'
})

//api4
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getRequiredmatchQuery = `
        SELECT * 
        FROM match_details
        WHERE match_id = ${matchId}
    ;`
  let match = await db.get(getRequiredmatchQuery)

  response.send({
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  })
})

//api5
app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getRequiredplayerQuery = `
        select match_details.match_id,match,year
        from 
        match_details join player_match_score on 
        match_details.match_id = player_match_score.match_id
        where player_match_score.player_id = ${playerId}
    ;`
  let matches = await db.all(getRequiredplayerQuery)
  const format = matches => {
    return {
      matchId: matches.match_id,
      match: matches.match,
      year: matches.year,
    }
  }
  response.send(matches.map(eachMatch => format(eachMatch)))
})

//api6
app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params
  const getRequiredplayerQuery = `
        select player_details.player_id,
        player_details.player_name
        from 
        player_details join player_match_score on 
        player_details.player_id = player_match_score.player_id
        where player_match_score.match_id = ${matchId}
    ;`
  let players = await db.all(getRequiredplayerQuery)
  const format = players => {
    return {
      playerId: players.player_id,
      playerName: players.player_name,
    }
  }
  response.send(players.map(eachplayer => format(eachplayer)))
})

//select sum(cases),sum(cured),sum(active),sum(deaths)
// from district group by player_id;
//api7
app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getRequiredplayerQuery = `
      select 
      pd.player_id,
      pd.player_name,
      sum(score) as totalScore,
      sum(fours) as totalFours,
      sum(sixes) as totalSixes
      from player_details pd join player_match_score pm 
      on pd.player_id = pm.player_id 
      group by pm.player_id 
      having pm.player_id = ${playerId}
    ;`
  let stats = await db.get(getRequiredplayerQuery)
  response.send({
    playerId : stats.player_id,
    playerName : stats.player_name,
    totalScore : stats.totalScore,
    totalFours : stats.totalFours,
    totalSixes : stats.totalSixes
  })
})



module.exports = app
