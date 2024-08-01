let url = "http://ip-api.com/json/?fields=8450015&lang=en-US"
$httpClient.get(url, function(error, response, data){
    let jsonData = JSON.parse(data)
	let query =jsonData.query 
	let isp =jsonData.isp
	let as =jsonData.as
	let country =jsonData.country
	let city =jsonData.city
	let timezone =jsonData.timezone
    let emoji = getFlagEmoji(jsonData.countryCode)
const params = getParams($argument);
  body = {
    title: "Node Info",
    content: `🗺️IP：${query}\n🖥️ISP：${isp}\n#️⃣ASN：${as}\n🌍Region：${emoji}${country}\n🏙City：${city}\n🕗Time Zone：${timezone}`,
        icon: params.icon,
        "icon-color": params.color
  }
  $done(body);
});

function getFlagEmoji(countryCode) {
      if (countryCode.toUpperCase() == 'TW') {
    countryCode = 'CN'
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt())
  return String.fromCodePoint(...codePoints)
}

function getParams(param) {
  return Object.fromEntries(
    $argument
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}