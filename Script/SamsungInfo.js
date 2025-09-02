const preLoading = {
    url: 'https://192.168.1.1/',
    insecure: true
};
function flattenKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    let result = Array.isArray(obj) ? [] : {};
    for (let key in obj) {
        let newKey = key.replace(/[:].*$/, ''); // 去掉冒号和类型
        result[newKey] = flattenKeys(obj[key]);
    }
    return result;
}
$httpClient.get(preLoading, (error, response, data) => {
    if (error) {
        console.log('Router access faild:', error);
        $done();
        return;
    }
    const postHeaders = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br'
    };
    const postBody = {
      "data_usage:o": {
        "one_month:o": {
          "data_usage_cycle:s": "", "maximum:s": "", "hs_value:s": "",
          "hs_a_value:s": "", "total_value:s": "", "limit_value:s": "",
          "warning_value:s": "", "limit_status:b": "", "warning_status:b": "",
          "data_usage_counter:i": ""
        },
        "three_day:o": {
          "data_usage_cycle:s": "", "maximum:s": "", "hs_yesterday:s": "",
          "hs_today:s": "", "hs_a_yesterday:s": "", "hs_a_today:s": "",
          "total_value:s": "", "warning_value:s": "", "warning_status:b": "",
          "data_usage_counter:i": ""
        }
      },
      "sys:strength:o": {
        "signal_percent:s": "",
        "signal_strength:s": ""
      }
    };
    const dataRequest = {
        url: 'https://192.168.1.1/_get/mhs',
        insecure: true,      
        headers: postHeaders,
        body: JSON.stringify(postBody)
    };
    $httpClient.post(dataRequest, (error, response, data) => {
        if (error) {
            console.log('Data access denied:', error);
            $done();
            return;
        }
        let jsonData = JSON.parse(data);
        let flatData = flattenKeys(jsonData);
        let monthMax = flatData.data_usage.one_month.maximum;
        let monthUsed = flatData.data_usage.one_month.total_value;
        let threeDayMax = flatData.data_usage.three_day.maximum;
        let threeDayUsed = flatData.data_usage.three_day.total_value;
        let signalPercent = flatData.sys.signal_percent;
        let signalStrength = flatData.sys.signal_strength;
        let monthUsage = `${monthUsed} / ${monthMax} GB`;
        let threeDayUsage = `${threeDayUsed} / ${threeDayMax} GB`;
        let signalInfo = `${signalStrength} (${signalPercent}%)`;
        $done({
                title: "Samsung 5G Mobile Wi-Fi",
                content: `📶 ${signalInfo}\n📅 ${monthUsage}\n🗓 ${threeDayUsage}`,
                icon: "wifi",
                "icon-color": "#41b9ffff"
            });
        $done();
    });
});


