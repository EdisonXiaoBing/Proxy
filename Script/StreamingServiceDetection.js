const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
  'Accept-Language': 'en',
}

// Statuses for streaming service availability
const STATUS_COMING = 2     // Coming soon
const STATUS_AVAILABLE = 1  // Available
const STATUS_NOT_AVAILABLE = 0  // Not available
const STATUS_TIMEOUT = -1   // Timeout
const STATUS_ERROR = -2     // Error

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'

(async () => {
  let panel_result = {
    title: 'Streaming Service Availability',
    content: '',
    icon: 'play.tv.fill',
    'icon-color': '#FF2D55',
  }

  let [{ region, status }] = await Promise.all([testDisneyPlus()])
  await Promise.all([check_youtube_premium(), check_netflix(), check_crunchyroll()])
    .then((result) => { 
      console.log(result)
      let disney_result = ""
      if (status == STATUS_COMING) {
          disney_result = "Disney+: Coming Soon~ " + region.toUpperCase()
      } else if (status == STATUS_AVAILABLE) {
          disney_result = "Disney+: Unlocked, Region: " + region.toUpperCase()
      } else if (status == STATUS_NOT_AVAILABLE) {
          disney_result = "Disney+: Not Supported 🚫"
      } else if (status == STATUS_TIMEOUT) {
          disney_result = "Disney+: Check Timeout 🚦"
      }
      result.push(disney_result)
      console.log(result)
      let content = result.join('\n')
      console.log(content)

      panel_result['content'] = content
    })
    .finally(() => {
      $done(panel_result)
    })
})()

async function check_youtube_premium() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      let option = {
        url: 'https://www.youtube.com/premium',
        headers: REQUEST_HEADERS,
      }
      $httpClient.get(option, function (error, response, data) {
        if (error != null || response.status !== 200) {
          reject('Error')
          return
        }

        if (data.indexOf('Premium is not available in your country') !== -1) {
          resolve('Not Available')
          return
        }

        let region = ''
        let re = new RegExp('"countryCode":"(.*?)"', 'gm')
        let result = re.exec(data)
        if (result != null && result.length === 2) {
          region = result[1]
        } else if (data.indexOf('www.google.cn') !== -1) {
          region = 'CN'
        } else {
          region = 'US'
        }
        resolve(region)
      })
    })
  }

  let youtube_check_result = 'YouTube: '

  await inner_check()
    .then((code) => {
      if (code === 'Not Available') {
        youtube_check_result += 'Not Available for Unlocking'
      } else {
        youtube_check_result += 'Unlocked, Region: ' + code.toUpperCase()
      }
    })
    .catch((error) => {
      youtube_check_result += 'Check Failed, Please Refresh the Panel'
    })

  return youtube_check_result
}

async function check_netflix() {
  let inner_check = (filmId) => {
    return new Promise((resolve, reject) => {
      let option = {
        url: 'https://www.netflix.com/title/' + filmId,
        headers: REQUEST_HEADERS,
      }
      $httpClient.get(option, function (error, response, data) {
        if (error != null) {
          reject('Error')
          return
        }

        if (response.status === 403) {
          reject('Not Available')
          return
        }

        if (response.status === 404) {
          resolve('Not Found')
          return
        }

        if (response.status === 200) {
          let url = response.headers['x-originating-url']
          let region = url.split('/')[3]
          region = region.split('-')[0]
          if (region == 'title') {
            region = 'us'
          }
          resolve(region)
          return
        }

        reject('Error')
      })
    })
  }

  let netflix_check_result = 'Netflix: '

  await inner_check(81280792)
    .then((code) => {
      if (code === 'Not Found') {
        return inner_check(80018499)
      }
      netflix_check_result += 'Fully Unlocked, Region: ' + code.toUpperCase()
      return Promise.reject('BreakSignal')
    })
    .then((code) => {
      if (code === 'Not Found') {
        return Promise.reject('Not Available')
      }

      netflix_check_result += 'Only Original Content Unlocked, Region: ' + code.toUpperCase()
      return Promise.reject('BreakSignal')
    })
    .catch((error) => {
      if (error === 'BreakSignal') {
        return
      }
      if (error === 'Not Available') {
        netflix_check_result += 'Node Not Supported for Unlocking'
        return
      }
      netflix_check_result += 'Check Failed, Please Refresh the Panel'
    })

  return netflix_check_result
}

async function check_crunchyroll() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      let option = {
        url: 'https://www.crunchyroll.com/',
        headers: REQUEST_HEADERS,
      }
      $httpClient.get(option, function (error, response, data) {
        if (error != null) {
          reject('Error')
          return
        }

        if (data.indexOf('Sorry, this video is not available in your region.') !== -1) {
          resolve('Not Available')
          return
        }

        let region = ''
        let re = new RegExp('"locale":"(.*?)"', 'gm')
        let result = re.exec(data)
        if (result != null && result.length === 2) {
          region = result[1]
        } else {
          region = 'US'
        }
        resolve(region)
      })
    })
  }

  let crunchyroll_check_result = 'Crunchyroll: '

  await inner_check()
    .then((code) => {
      if (code === 'Not Available') {
        crunchyroll_check_result += 'Not Available for Unlocking'
      } else {
        crunchyroll_check_result += 'Unlocked, Region: ' + code.toUpperCase()
      }
    })
    .catch((error) => {
      crunchyroll_check_result += 'Check Failed, Please Refresh the Panel'
    })

  return crunchyroll_check_result
}

async function testDisneyPlus() {
  try {
      let { region, cnbl } = await Promise.race([testHomePage(), timeout(7000)])
      console.log(`homepage: region=${region}, cnbl=${cnbl}`)
      // Coming soon
      // if (cnbl == 2) {
      //   return { region, status: STATUS_COMING }
      // }
      let { countryCode, inSupportedLocation } = await Promise.race([getLocationInfo(), timeout(7000)])
      console.log(`getLocationInfo: countryCode=${countryCode}, inSupportedLocation=${inSupportedLocation}`)
      
      region = countryCode ?? region
      console.log("region:" + region)
      // Coming soon
      if (inSupportedLocation === false || inSupportedLocation === 'false') {
        return { region, status: STATUS_COMING }
      } else {
        // Available for unlocking
        return { region, status: STATUS_AVAILABLE }
      }
      
    } catch (error) {
      console.log("error:" + error)
      
      // Not supported for unlocking
      if (error === 'Not Available') {
        console.log("Not supported")
        return { status: STATUS_NOT_AVAILABLE }
      }
      
      // Check timeout
      if (error === 'Timeout') {
        return { status: STATUS_TIMEOUT }
      }
      
      return { status: STATUS_ERROR }
    } 
    
}

function getLocationInfo() {
  return new Promise((resolve, reject) => {
    let opts = {
      url: 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql',
      headers: {
        'Accept-Language': 'en',
        Authorization: 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84',
        'Content-Type': 'application/json',
        'User-Agent': UA,
      },
      body: JSON.stringify({
        query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',
        variables: {
          input: {
            applicationRuntime: 'chrome',
            attributes: {
              browserName: 'chrome',
              browserVersion: '94.0.4606',
              manufacturer: 'apple',
              model: null,
              operatingSystem: 'macintosh',
              operatingSystemVersion: '10.15.7',
              osDeviceIds: [],
            },
            deviceFamily: