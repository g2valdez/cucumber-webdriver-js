

module.exports = function (locator) {
  const element = {};
  element.locator = locator;

  async function callWDElementFunction(name, arg) {
    console.log(name);
      await driver.wait(until.elementLocated(element.locator), 5000, `Element ${element.locator} not in DOM`);

      const wdElement = driver.findElement(element.locator);
      driver.executeScript("arguments[0].scrollIntoView(false)", wdElement);
      await driver.wait(until.elementIsVisible(wdElement), 5000, `Element ${element.locator} not visible`)
    try {
      if (arg) {
        if (arg === 'ES') return driver.executeScript(`arguments[0].${name}()`, wdElement);
        else return wdElement[name](arg);
      }
      else return wdElement[name]();
    }
    catch(err) {
      if (err.name === "StaleElementReferenceError") {
        await driver.wait(until.elementLocated(element.locator), 5000, `Element ${element.locator} not in DOM`)
      }
      return err;
    }
  }

  element.click = function () {
    return callWDElementFunction('click');
  };

  element.sendKeys = function (keys) {
    return callWDElementFunction('sendKeys', keys);
  };

  element.clear = function () {
    return callWDElementFunction('clear');
  };

  // // // // // These functions expose the user to raw webdriver, which can lead to complete execution failure
  element.findElements = function (byLocator) {
    return callWDElementFunction('findElements', byLocator);
  };

  element.findElement = function (byLocator) {
    return callWDElementFunction('findElement', byLocator);
  };
  // // // // //

  element.getText = function () {
    return callWDElementFunction('getText').then(function (gottenText) {
      return gottenText.trim();
    });
  };

  element.getAttribute = function (attr) {
    return callWDElementFunction('getAttribute', attr);
  };

  element.isDisplayed = function () {
    return callWDElementFunction('isDisplayed');
  };

  // waits for info extracted from an element to satisfy the inputted matching text
  // params:
  // extractInfo = function that takes in an element, and returns a promise to the necessary information
  // matchFunc = function that takes two text elements and returns true or false based on the comparison
  // expectedText = the text that the extracted info is compared to
  const waitFor = function (extractInfo, matchFunc, expectedText) {
    return new Promise((resolve, reject) => {
      const start = new Date();
      let endCheck = false;
      const checkTextFunction = function (toPrint) {
        const end = new Date() - start;
        if (end / 1000 > 5) endCheck = true;
        if (endCheck) resolve(new Error(toPrint));
        driver.wait(until.elementLocated(element.locator), 10000).then(() => {
          const testElement = driver.findElement(element.locator);

          extractInfo(testElement)
            .then((text) => {
              if (matchFunc(text, expectedText)) {
                endCheck = true;
                resolve();
              }
              else resolve(new Error("Text was " + text));
            })
            .catch(checkTextFunction);
        })
          .catch(resolve);
      };

      checkTextFunction("Start");
    });

  };

  element.waitUntil =
    {
      text: {
        is: (text) => {
          return waitFor((testElement) => {
            return testElement.getText();
          }, (actual, expected) => {
            return actual.trim() === expected.trim();
          }, text);
        },
        matches: (text) => {
          return waitFor((testElement) => {
            return testElement.getText();
          }, (actual, expected) => {
            return new RegExp(expected).test(actual);
          }, text);
        },
        contains: (text) => {
          return waitFor((testElement) => {
            return testElement.getText();
          }, (actual, expected) => {
            return actual.indexOf(expected) > -1;
          }, text);
        }
      },
      value: {
        is: (text) => {
          return waitFor((testElement) => {
            return new Promise((resolve, reject) => {
              testElement.getAttribute('value').then((val) => {
                testElement.findElement(by.css(`option[value="${val}"]`)).getText().then((data) => {
                  resolve(data);
                }).catch((err) => {
                  reject(err);
                });
              }).catch((err) => {
                reject(err);
              });
            });
          }, (actual, expected) => {
            return actual === expected;
          }, text);
        },
        matches: (text) => {
          return waitFor((testElement) => {
            return new Promise((resolve, reject) => {
              testElement.getAttribute('value').then((val) => {
                testElement.findElement(by.css(`option[value="${val}"]`)).getText().then((data) => {
                  resolve(data);
                }).catch((err) => {
                  reject(err);
                });
              }).catch((err) => {
                reject(err);
              });
            });
          }, (actual, expected) => {
            return expected.test(actual);
          }, text);
        },
        contains: (text) => {
          return waitFor((testElement) => {
            return new Promise((resolve, reject) => {
              testElement.getAttribute('value').then((val) => {
                testElement.findElement(by.css(`option[value="${val}"]`)).getText().then((data) => {
                  resolve(data);
                }).catch((err) => {
                  reject(err);
                });
              }).catch((err) => {
                reject(err);
              });
            });
          }, (actual, expected) => {
            return actual.indexOf(expected) > -1;
          }, text);
        }
      }
    };


  return element;
};
