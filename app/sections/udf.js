import _ from 'lodash';
import $ from 'jquery';
import md5 from 'md5';
import moment from 'moment';
import React from 'react';
import ReactDOM from 'react-dom';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { Table, Column, Cell } from 'fixed-data-table';

import getHeaders from '../modules/getHeaders';
import getHost from '../modules/getHost';

let socket;
const cache = {};
const rows = [];
const url = `${getHost()}/apps/udf/msf`;

const TextCell = ({ rowIndex, data, col }) => (
  <Cell>
    {data[rowIndex][col]}
  </Cell>
);
TextCell.propTypes = {
  rowIndex: React.PropTypes.number,
  data: React.PropTypes.array,
  col: React.PropTypes.string,
};

class MyTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      width: 1000,
      height: 500,
    };
  }

  componentDidMount() {
    let wrapper = $(ReactDOM.findDOMNode(this)).parent()[0];
    new ResizeSensor(wrapper, () => {
      this.setState({
        width: wrapper.clientWidth - 20,
        height: wrapper.clientHeight - 20,
      });
    });
  }

  render() {
    let { width, height } = this.state;
    let { data } = this.props;

    return (
      <Table
        rowHeight={31}
        headerHeight={31}
        rowsCount={data.length}
        width={width}
        height={height}
        {...this.props}
      >
        <Column
          header={<Cell>Service</Cell>}
          cell={<TextCell data={data} col="service" />}
          flexGrow={1}
          width={100}
        />
        <Column
          header={<Cell>Transaction ID</Cell>}
          cell={<TextCell data={data} col="transactionId" />}
          flexGrow={1}
          width={100}
        />
        <Column
          header={<Cell>Backend</Cell>}
          cell={<TextCell data={data} col="backend" />}
          flexGrow={1}
          width={100}
        />
        <Column
          header={<Cell>Time</Cell>}
          cell={<TextCell data={data} col="time" />}
          flexGrow={1}
          width={100}
        />
        <Column
          header={<Cell>Size</Cell>}
          cell={<TextCell data={data} col="size" />}
          flexGrow={1}
          width={100}
        />
      </Table>
    );
  }
}

MyTable.propTypes = {
  data: React.PropTypes.array,
};

ReactDOM.render(
  <div className="box">
    <div className="box-body">
      <MyTable data={rows} />
    </div>
  </div>,
  document.getElementById('content-udf')
);

const updateRow = (id, data) => {
  let row = _.find(rows, { id });
  if (!row) return;

  _.assign(row, data);
};

const addRow = (id) => {
  let row = { id };
  rows.unshift(row);
  updateRow(id);
};

const udf = {
  init(_socket) {
    socket = _socket;

    let aaa = (id, headers, body, options) => {
      let useCache = _.get(options, 'cache');
      let cacheKey;
      let service = body.entity || body.Entity || {};
      service = service.e || service.E || 'batch';

      addRow(id);
      updateRow(id, {
        time: moment().format('HH:mm:ss.SSS'),
        service,
        start: new Date().getTime(),
      });

      if (useCache && /dapsfile/i.test(service)) {
        useCache = false;
      }

      if (useCache) {
        cacheKey = md5(JSON.stringify(body));
        if (cache[cacheKey]) {
          let { headers: resHeaders, data } = cache[cacheKey];
          updateRow(id, { cache: true });
          setTimeout(() => {
            socket.emit('udf-response', id, resHeaders, data);
          }, 300);
          return;
        }
      }

      $.ajax({
        url,
        method: 'post',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(body),
        headers: {
          'X-Tr-Applicationid': 'test',
        },
      })
      .then((data, status, xhr) => {
        let resHeaders = getHeaders(xhr.getAllResponseHeaders());
        updateRow(id, {
          stop: new Date().getTime(),
          size: resHeaders['content-length'],
          backend: resHeaders['x-tr-backend'],
          transactionId: resHeaders['x-tr-udf-transactionid'],
        });
        if (useCache) {
          cache[cacheKey] = {
            headers: resHeaders,
            data,
          };
        }
        socket.emit('udf-response', id, resHeaders, data);
      });
    };

    _.delay(() => {
      aaa('aaa', null, {
        Entity: {
          ID: 'Navigations',
          E: 'Navigations',
          W: {
            Ticker: 'AIV.N',
            TickerType: 'RIC',
          },
        },
      });
    }, 2000);
  },
};

export default udf;
