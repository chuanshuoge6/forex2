import React, { useState, useEffect } from 'react';
import { ScrollView, Modal, Dimensions, Image } from 'react-native';
import axios from 'axios'
import * as Font from 'expo-font'
import {
  Container, Header, Title, Content, Footer,
  FooterTab, Button, Left, Right, Body, Icon, Text,
  Accordion, Card, CardItem, Thumbnail, ListItem,
  CheckBox, DatePicker, DeckSwiper, View, Fab,
  Badge, Form, Item, Input, Label, Picker, Textarea,
  Switch, Radio, Spinner, Tab, Tabs, TabHeading,
  ScrollableTab, H1, H2, H3, Drawer,
} from 'native-base';
import { Col, Row, Grid } from "react-native-easy-grid";
import ForexListItem from './forexItem'
import { LineChart } from 'react-native-chart-kit'
import { countryFlag } from './countryFlag'
import FlagList from './FlagList'

export default function App() {
  const [loadfont, setloadfont] = useState(true)
  const [data, setdata] = useState(null)
  const [cad, setcad] = useState(1000)
  const [show_amount, setshow_amount] = useState(false)
  const [input_currency, setinput_currency] = useState('CAD')
  const [input_amount, setinput_amount] = useState(1000)
  const [btc_rate, setbtc_rate] = useState(null)
  const [x, setx] = useState([])
  const [y, sety] = useState([])
  const [show_chart, setshow_chart] = useState(false)
  const [base_currency, setbase_currency] = useState(null)
  const [convert_currency, setconvert_currency] = useState(null)
  const [base_or_conversion, setbase_or_conversion] = useState(false)
  const [show_flags, setshow_flags] = useState(false)
  const access_key = "816fa3bb7980076eb8bc623e55617ab6"

  useEffect(() => {
    initializeApp()
  }, [])

  initializeApp = async () => {

    await Font.loadAsync({
      'Roboto': require('native-base/Fonts/Roboto.ttf'),
      'Roboto_medium': require('native-base/Fonts/Roboto_medium.ttf'),
    });

    setloadfont(false)

    fetch_latest()
  }

  fetch_latest = () => {
    axios({
      method: 'get',
      url: 'http://api.exchangeratesapi.io/v1/latest?access_key=' + access_key,
    })
      .then(response => {
        const rates = response.data.rates
        setdata(rates)
        setcad(cad / response.data.rates.CAD)
        fetch_btc(response.data.rates.USD)
      })
      .catch(function (error) {
        alert(error);
        setTimeout(() => {
          fetch_latest()
        }, 5000);
      });
  }

  fetch_btc = (CADUSD) => {
    axios({
      method: 'get',
      url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
    })
      .then(response => {
        const rate = CADUSD / parseFloat(response.data.bpi.USD.rate.replace(',', ''))
        setbtc_rate(rate)
      })
      .catch(function (error) {
        alert(error);
        setTimeout(() => {
          fetch_btc(CADUSD)
        }, 5000);
      });
  }

  forex_button_press = (value, currency) => {
    setshow_amount(true)
    setinput_amount(value)
    setinput_currency(currency)
  }

  exchange_button_press = () => {
    setshow_amount(false)
    input_currency === 'BTC' ?
      setcad(input_amount / btc_rate)
      : setcad(input_amount / data[input_currency])
  }

  load_history = (a, b) => {
    setloadfont(true)
    const dates = []
    const ratios = []

    for (let i = 30; i > 0; i--) {
      get_past_day_rate(a, b, i, dates, ratios)
    }
  }

  get_past_day_rate = (a, b, n, dates, ratios) => {
    setbase_currency(a)
    setconvert_currency(b)

    const d = new Date()
    const end = d.toISOString().split('T')[0]
    d.setDate(-n)
    const start = d.toISOString().split('T')[0]

    const url = 'http://api.exchangeratesapi.io/v1/' + start
      + "?access_key=" + access_key

    axios({
      method: 'get',
      url: url,
    })
      .then(response => {
        const rates = response.data.rates
        const ratio = rates[b] / rates[a]

        dates.push(start)
        ratios.push(ratio)
      })
      .catch(function (error) {
        alert(error);
      })
      .finally(() => {
        console.log(dates, ratios)

        if (dates.length == 30) {
          const data = {}
          for (let i = 0; i < 30; i++) {
            data[dates[i]] = ratios[i]
          }

          const dates_sorted = dates.sort()
          const ratios_sorted = []

          for (let i = 0; i < 30; i++) {
            ratios_sorted.push(data[dates_sorted[i]])
          }

          console.log(dates_sorted, ratios_sorted)

          setx(dates_sorted)
          sety(ratios_sorted)
          setshow_chart(true)
          setloadfont(false)
        }

      });
  }

  changeCountry = (currency) => {
    base_or_conversion ?
      load_history(base_currency, currency)
      : load_history(currency, convert_currency)
  }

  if (loadfont || !data) {
    return (<Container style={{ backgroundColor: '#1C2833' }}>
      <Content><Spinner /></Content></Container>)
  }

  return (
    <Container style={{ backgroundColor: '#1C2833', marginTop: 25 }}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={show_amount}
      >
        <Content>

          <Item style={{ backgroundColor: 'white' }}>
            <Input
              style={{ height: 100, fontSize: 30 }}
              keyboardType="number-pad"
              value={input_amount}
              onChangeText={e => setinput_amount(e ? e.match(/^([0-9]+(\.[0-9]+)?)/g)[0] : '1')}
              onSubmitEditing={() => exchange_button_press()} />
            <Text style={{ fontSize: 30 }}>{input_currency}</Text>
            <Button large transparent onPress={() => exchange_button_press()}>
              <Text style={{ fontSize: 50, marginTop: 25 }}>{"\u21c4"}</Text>
            </Button>
            <Button large transparent onPress={() => setshow_amount(false)}>
              <Text style={{ fontSize: 30, marginTop: 35 }}>{"\u2715"}</Text>
            </Button>
          </Item>
        </Content>
      </Modal>

      <Modal
        animationType="fade"
        transparent={false}
        visible={show_chart}
      >
        <Container style={{ backgroundColor: '#1C2833' }}>
          <Header >
            <Left>
              <Button transparent onPress={() => setshow_chart(false)}>

                <Text style={{ fontSize: 50 }}>{"\u2190"}</Text>
              </Button>
            </Left>
            <Body style={{ alignItems: 'center' }}>
              <Title>Last 30 Day Rate</Title>
            </Body>
            <Right>
            </Right>
          </Header>

          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-around' }}>
            {base_currency ?
              <Button transparent onPress={() => { setbase_or_conversion(false); setshow_flags(true) }}>
                <Image
                  style={{ width: 50, height: 40, marginTop: 5 }}
                  source={countryFlag[base_currency]}
                />
              </Button>
              : null}

            {convert_currency ?
              <Button transparent onPress={() => { setbase_or_conversion(true); setshow_flags(true) }}>
                <Image
                  style={{ width: 50, height: 40, marginTop: 5 }}
                  source={countryFlag[convert_currency]}
                />
              </Button>
              : null}
          </View>

          <LineChart
            data={{
              labels: [x[0]],
              datasets: [{
                data: y
              }]
            }}
            width={Dimensions.get('window').width} // from react-native
            height={300}
            chartConfig={{
              backgroundColor: 'blue',
              backgroundGradientFrom: 'green',
              backgroundGradientTo: '#ffa726',
              decimalPlaces: 3, // optional, defaults to 2dp
              color: (opacity = 1) => `rgba(255, 255, 255, 0.7)`,

            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </Container>
      </Modal>

      <FlagList show={show_flags} close={() => setshow_flags(false)}
        country_selection={(currency) => changeCountry(currency)}></FlagList>

      <Content>
        <ScrollView>
          <Grid>
            <Col style={{ alignItems: 'center' }}>
              <Row style={{ height: 50 }}>
                <ForexListItem currency='CAD' rate={data.CAD} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'CAD')}
                  buttonLongPress={() => { }}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='CNY' rate={data.CNY} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'CNY')}
                  buttonLongPress={() => load_history('CAD', 'CNY')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='AUD' rate={data.AUD} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'AUD')}
                  buttonLongPress={() => load_history('CAD', 'AUD')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='HKD' rate={data.HKD} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'HKD')}
                  buttonLongPress={() => load_history('CAD', 'HKD')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='ISK' rate={data.ISK} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'ISK')}
                  buttonLongPress={() => load_history('CAD', 'ISK')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='HUF' rate={data.HUF} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'HUF')}
                  buttonLongPress={() => load_history('CAD', 'HUF')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='SEK' rate={data.SEK} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'SEK')}
                  buttonLongPress={() => load_history('CAD', 'SEK')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='BRL' rate={data.BRL} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'BRL')}
                  buttonLongPress={() => load_history('CAD', 'BRL')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='MYR' rate={data.MYR} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'MYR')}
                  buttonLongPress={() => load_history('CAD', 'MYR')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='NOK' rate={data.NOK} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'NOK')}
                  buttonLongPress={() => load_history('CAD', 'NOK')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='MXN' rate={data.MXN} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'MXN')}
                  buttonLongPress={() => load_history('CAD', 'MXN')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='PLN' rate={data.PLN} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'PLN')}
                  buttonLongPress={() => load_history('CAD', 'PLN')}
                ></ForexListItem>
              </Row>
            </Col>
            <Col>
              <Row style={{ height: 50 }}>
                <ForexListItem currency='USD' rate={data.USD} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'USD')}
                  buttonLongPress={() => load_history('CAD', 'USD')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='EUR' rate={data.EUR} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'EUR')}
                  buttonLongPress={() => load_history('CAD', 'EUR')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='GBP' rate={data.GBP} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'GBP')}
                  buttonLongPress={() => load_history('CAD', 'GBP')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='CHF' rate={data.CHF} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'CHF')}
                  buttonLongPress={() => load_history('CAD', 'CHF')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='PHP' rate={data.PHP} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'PHP')}
                  buttonLongPress={() => load_history('CAD', 'PHP')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='CZK' rate={data.CZK} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'CZK')}
                  buttonLongPress={() => load_history('CAD', 'CZK')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='IDR' rate={data.IDR} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'IDR')}
                  buttonLongPress={() => load_history('CAD', 'IDR')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='HRK' rate={data.HRK} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'HRK')}
                  buttonLongPress={() => load_history('CAD', 'HRK')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='BGN' rate={data.BGN} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'BGN')}
                  buttonLongPress={() => load_history('CAD', 'BGN')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='NZD' rate={data.NZD} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'NZD')}
                  buttonLongPress={() => load_history('CAD', 'NZD')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='SGD' rate={data.SGD} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'SGD')}
                  buttonLongPress={() => load_history('CAD', 'SGD')}
                ></ForexListItem>
              </Row>
            </Col>
            <Col>
              <Row style={{ height: 50 }}>
                {btc_rate ?
                  <ForexListItem currency='BTC' rate={btc_rate} CAD={cad}
                    buttonPress={(value) => forex_button_press(value, 'BTC')}
                    buttonLongPress={() => { }}
                  ></ForexListItem> : <Spinner />
                }
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='JPY' rate={data.JPY} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'JPY')}
                  buttonLongPress={() => load_history('CAD', 'JPY')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='RUB' rate={data.RUB} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'RUB')}
                  buttonLongPress={() => load_history('CAD', 'RUB')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='KRW' rate={data.KRW} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'KRW')}
                  buttonLongPress={() => load_history('CAD', 'KRW')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='DKK' rate={data.DKK} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'DKK')}
                  buttonLongPress={() => load_history('CAD', 'DKK')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='RON' rate={data.RON} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'RON')}
                  buttonLongPress={() => load_history('CAD', 'RON')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='INR' rate={data.INR} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'INR')}
                  buttonLongPress={() => load_history('CAD', 'INR')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='THB' rate={data.THB} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'THB')}
                  buttonLongPress={() => load_history('CAD', 'THB')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='TRY' rate={data.TRY} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'TRY')}
                  buttonLongPress={() => load_history('CAD', 'TRY')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='ZAR' rate={data.ZAR} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'ZAR')}
                  buttonLongPress={() => load_history('CAD', 'ZAR')}
                ></ForexListItem>
              </Row>

              <Row style={{ height: 50 }}>
                <ForexListItem currency='ILS' rate={data.ILS} CAD={cad}
                  buttonPress={(value) => forex_button_press(value, 'ILS')}
                  buttonLongPress={() => load_history('CAD', 'ILS')}
                ></ForexListItem>
              </Row>
            </Col>
          </Grid>
        </ScrollView>
      </Content>
    </Container>
  );
}