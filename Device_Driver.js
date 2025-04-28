// Created by Dmitry Nazarov (https://t.me/dm_naz)


// Функция создания драйвера для управления устройством
function device_type_model(driverName, deviceIP, devicePort, deviceDebug) {
  // Подключение к устройству и инициализация локальных переменных
  var DEV = IR.GetDevice(driverName);
  if (deviceIP) DEV.SetParameters({ Host: deviceIP });
  if (devicePort) DEV.SetParameters({ Port: devicePort });
  if (deviceDebug == undefined) deviceDebug = false;
  DEV.Connect();

  var devicePoll;
  var deviceAnswerCounter = 5;


  // Логика для периодического опроса устройства (опционально)
  var pollCounter = -1;
  var pollCommands = [
    [], // Команда №1
    [], // Команда №2
  ];

  function makeDevicePoll() {
    if (!pollCommands.length) return;

    pollCounter = (pollCounter + 1) % pollCommands.length;
    DEV.Send(pollCommands[pollCounter]);

    if (deviceAnswerCounter > 0) {
     deviceAnswerCounter -= 1;
    } else {
      deviceAnswerCounter = 0;
      executeOfflineCommands();
      DEV.SetFeedback("logic_status_fb", 0);
    }
  }

  devicePoll = IR.SetInterval(1e3 * (3 + 0.5 * Math.random()), makeDevicePoll());


  // Функции драйвера для управления устройством
  var cmd = {
    sendСommandToDevice: function () {
      DEV.Send([]);
    },
  };


  // Управление из графического интерфейса
  IR.AddListener(IR.EVENT_CHANNEL_SET, DEV, function (tagName, tagValue) {
    if (deviceDebug) console.log(driverName.toUpperCase(), "CHANNEL", tagName, tagValue);

    switch (tagName) {
      case "tag_name": // Имя тега в дереве драйвера
        cmd.sendСommandToDevice(); // Вызов функции из блока "Функции драйвера для управления устройством"
      break;
    }
  });


  // Разбор обратной связи от устройства
  var variableRe; // Регулярное выражение присылаемого от устройства сообщения

  function fbHandler(deviceResponce) {
    // Проверка совпадения созданной строки с неким паттерном
    var matchData = deviceResponce.match(variableRe);

    if (matchData) {
      // Действия при совпадении ответа с регулярным выражением
      return;
    }

    // Проверка совпадения созданной строки с неким паттерном
    if (deviceResponce.startsWith("\xFF\xFF\xFF")) {
      // Действия при выполнении условия
      return;
    }

    // Проверка совпадения пришедших данных с неким паттерном
    if (byteResponse[0] == 0x01 && byteResponse[1] == 0x02 && byteResponse[2] == 0x03) {
      // Действия при выполнении условия
      return;
    }
  }


  // Обработка обратной связи от устройства
  var rxData = "";

  IR.AddListener(IR.EVENT_RECEIVE_TEXT, DEV, function (textResponse) {
    if (deviceDebug) console.log(driverName.toUpperCase(), "RESPONSE", textResponse);

    // Обновляем счётчик, так как получили ответ от устройства
    deviceAnswerCounter = 5;
    executeOnlineCommands();
    DEV.SetFeedback("logic_online_fb", 1);

    rxData += textResponse;

    while (rxData.includes("\x0D")) {
      var endPos = rxData.indexOf("\x0D");
      if (endPos < 0) return;
      var fb = rxData.slice(0, endPos + 1);
      rxData = rxData.slice(endPos + 1);

      fbHandler(fb);
    }
  });

  // Обработка обратной связи от устройства
  var rxData = "";

  IR.AddListener(IR.EVENT_RECEIVE_DATA, DEV, function (byteResponse) {
    if (deviceDebug) console.log(driverName.toUpperCase(), "RESPONSE", byteResponse.join());

    // Обновляем счётчик, так как получили ответ от устройства
    deviceAnswerCounter = 5;
    executeOnlineCommands();
    DEV.SetFeedback("logic_status_fb", 1);

    // Перевод двоичных данных в строку
    for (var i = 0; i < byteResponse.length; i++) {
      rxData += String.fromCharCode(byteResponse[i]);
    }

    while (rxData.includes("\x0D")) {
      var endPos = rxData.indexOf("\x0D");
      if (endPos < 0) return;
      var fb = rxData.slice(0, endPos + 1);
      rxData = rxData.slice(endPos + 1);

      fbHandler(fb);
    }
  });

  // Обработка обратной связи от устройства
  IR.AddListener(IR.EVENT_RECEIVE_DATA, DEV, function (byteResponse) {
    if (deviceDebug) console.log(driverName.toUpperCase(), "RESPONSE", byteResponse.join());

    // Обновляем счётчик, так как получили ответ от устройства
    deviceAnswerCounter = 5;
    executeOnlineCommands();
    DEV.SetFeedback("logic_status_fb", 1);

    fbHandler(byteResponse);
  });


  // Действия на событие "оффлайн" для подключения (опционально)
  function executeOfflineCommands() {
    if (DEV.GetFeedback("logic_status_fb") == 0) return;

    var fbsCount = DEV.GetFeedbacksCount();

    for (var fbCounter = 0; fbCounter < fbsCount; fbCounter++) {
      DEV.SetFeedback(DEV.GetFeedbackAtPos(fbCounter)["name"], 0);
    }
  }


  // Действия на событие "онлайн" для подключения (опционально)
  function executeOnlineCommands() {
    if (DEV.GetFeedback("logic_status_fb") == 1) return;

    // Набор команд при восстановлении ответов на опрос устройства
  }


  // Предоставление функций драйвера для вызова из других файлов скрипта проекта
  return cmd;
}


/*
  Инициализация драйвера для тестирования и отладки
  Управление по TCP/UDP/HTTP, IP-адрес устройства, Port: __
  Управление по RS232/RS485/RS422, Baud Rate: __bps, Data Bit: __ bits, Parity: __, Stop Bit: __, Flow Control: __
*/
var DEVICE = new device_type_model("Device_In_Tree", "IP", "Port", false);
