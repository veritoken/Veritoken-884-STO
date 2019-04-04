const getKeyByNestedValue = function(object, value) {
  return Object.keys(object).find(key => {
    //nestedObj has `key` "cSuite" and value `{ address: '0x..', identityString: 'VERI..74'}`
    const nestedObj = object[key]
    // return `key` where the "address" or "identityString" match the input `value`
    return Object.keys(nestedObj).find(nestedKey => nestedObj[nestedKey] === value)
  })
}

module.exports = getKeyByNestedValue
