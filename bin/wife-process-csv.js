#! /usr/bin/env node

const fs = require('fs')
const parse = require('csv-parse')
const stringify = require('csv-stringify')

const handleError = err => {
  if (err) {
    return console.error(err)
  }
}
const getPartyName = row => row['Party Name']
const delimiter = ' and '
const isTwoPeople = row => getPartyName(row).includes(delimiter)
const attendees = row => getPartyName(row).split(delimiter)
const updateRow = row => (person, primary) => ({ ...row, Attendee: person, 'Is Primary?': primary })
const getPrimariesAndSecondaries = output => output.reduce(([primaries, secondaries], row) => {
  const updateThisRow = updateRow(row)
  const [firstPerson, secondPerson] = attendees(row)
  const primary = updateThisRow(firstPerson, true)
  const secondary = updateThisRow(secondPerson, false)
  const updatedPrimaries = [...primaries, primary]

  return isTwoPeople(row)
    ? [updatedPrimaries, [...secondaries, secondary]]
    : [updatedPrimaries, [...secondaries]]
}, [[], []])

const writeUpdatedCsv = input => {
  parse(input, { columns: true, header: true }, (err, output) => {
    handleError(err) // Gross side-effect

    const [primaries, secondaries] = getPrimariesAndSecondaries(output)
    const updatedCsv = [...primaries, ...secondaries]

    stringify(updatedCsv, { header: true }, (err, output) => {
      handleError(err) // Gross side-effect

      fs.writeFile('output.csv', output, (err) => {
        handleError(err) // Gross side-effect
        console.log('File `output.csv` saved successfully! 🎉')
      })
    })
  })
}

const filename = process.argv.slice(2)[0]
fs.readFile(filename, 'utf8', (err, input) => {
  if (err) throw err
  writeUpdatedCsv(input)
})
