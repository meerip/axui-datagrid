import * as React from 'react';

import {
  calculateDimensions,
  throttle,
  getScrollPosition,
  getPositionPrintColGroup,
  getTableByStartEndColumnIndex,
  getNode,
  getStylesAboutFilteredList,
} from '../utils';
import dataGridFormatter from '../functions/formatter';
import dataGridCollector from '../functions/collector';
import { IDataGrid } from '../common/@types';
import { DataGridEnums } from '../common/@enums';

export interface IDataGridStore extends IDataGrid.IStoreState {
  setStoreState: (store: IDataGrid.IStoreState) => void;
  dispatch: (
    dispatchType: DataGridEnums.DispatchTypes,
    param: IDataGrid.DispatchParam,
  ) => void;
}

const store: IDataGridStore = {
  sortInfo: {},
  isColumnFilter: false,
  scrollLeft: 0,
  scrollTop: 0,
  selectionRows: {},
  selectionCols: {},
  focusedRow: -1,
  focusedCol: -1,
  selectionStartOffset: {},
  selectionEndOffset: {},
  selectionMinOffset: {},
  selectionMaxOffset: {},
  selectionSRow: -1,
  selectionSCol: -1,
  selectionERow: -1,
  selectionECol: -1,
  columnResizing: false,
  columnResizerLeft: 0,

  mounted: false,
  loading: false,
  loadingData: false,

  data: [],
  filteredList: [],
  listSelectedAll: false,
  colGroup: [],
  asideColGroup: [],
  leftHeaderColGroup: [],
  headerColGroup: [],
  asideHeaderData: { rows: [{ cols: [] }] },
  leftHeaderData: { rows: [{ cols: [] }] },
  headerData: { rows: [{ cols: [] }] },
  asideBodyRowData: { rows: [{ cols: [] }] },
  leftBodyRowData: { rows: [{ cols: [] }] },
  bodyRowData: { rows: [{ cols: [] }] },
  asideBodyGroupingData: { rows: [{ cols: [] }] },
  leftBodyGroupingData: { rows: [{ cols: [] }] },
  bodyGroupingData: { rows: [{ cols: [] }] },
  colGroupMap: {},
  bodyRowMap: {},
  bodyGroupingMap: {},
  options: {},
  styles: {},

  predefinedFormatter: {},
  predefinedCollector: {},
  setStoreState: () => {},
  dispatch: () => {},
};

const { Provider, Consumer } = React.createContext(store);

class StoreProvider extends React.Component<any, IDataGrid.IStoreState> {
  state = store;

  throttledUpdateDimensions: any;

  static getDerivedStateFromProps(nProps: any, nState: IDataGrid.IStoreState) {
    if (
      nProps.mounted === nState.mounted &&
      nProps.loading === nState.loading &&
      nProps.loadingData === nState.loadingData &&
      nProps.setRootState === nState.setRootState &&
      nProps.getRootState === nState.getRootState &&
      nProps.rootNode === nState.rootNode &&
      nProps.clipBoardNode === nState.clipBoardNode &&
      nProps.rootObject === nState.rootObject &&
      nProps.data === nState.data &&
      nProps.options === nState.options &&
      nProps.height === nState.height &&
      nProps.onBeforeEvent === nState.onBeforeEvent &&
      nProps.onAfterEvent === nState.onAfterEvent &&
      nProps.onScrollEnd === nState.onScrollEnd &&
      nProps.onRightClick === nState.onRightClick &&
      nProps.selection === nState.selection &&
      nProps.rowSelector === nState.rowSelector &&
      nProps.headerTable === nState.headerTable &&
      nProps.bodyRowTable === nState.bodyRowTable &&
      nProps.bodyRowMap === nState.bodyRowMap &&
      nProps.asideHeaderData === nState.asideHeaderData &&
      nProps.leftHeaderData === nState.leftHeaderData &&
      nProps.headerData === nState.headerData &&
      nProps.asideColGroup === nState.asideColGroup &&
      nProps.asideBodyRowData === nState.asideBodyRowData &&
      nProps.leftBodyRowData === nState.leftBodyRowData &&
      nProps.bodyRowData === nState.bodyRowData &&
      nProps.colGroup === nState.colGroup &&
      nProps.colGroupMap === nState.colGroupMap &&
      nProps.leftHeaderColGroup === nState.leftHeaderColGroup &&
      nProps.headerColGroup === nState.headerColGroup &&
      (nState.styles &&
        nProps.styles.CTInnerWidth === nState.styles.CTInnerWidth &&
        nProps.styles.CTInnerHeight === nState.styles.CTInnerHeight)
    ) {
      return null;
    } else {
      let scrollTop = nState.scrollTop;
      let scrollLeft = nState.scrollLeft;

      let filteredList = nState.filteredList || [];
      let styles: IDataGrid.IStyles = nState.styles || {};
      const { sortInfo } = nState;
      const { data, styles: _styles = {}, options: _options = {} } = nProps;

      // 데이터를 정리하는 과정. data > filteredList
      if (data && nProps.data !== nState.data) {
        // sort 되었다고 판단됨. filteredList를 sort 해주어야 함.
        const { options = {} } = nState;
        const { columnKeys: optionColumnKeys = {} } = options;

        filteredList = data.filter((n: any) => {
          return !n[optionColumnKeys.deleted || '_deleted_'];
        });

        // 정렬 오브젝트가 있다면 정렬 프로세스 적용하여 새로운 데이터 정렬
        if (sortInfo && Object.keys(sortInfo).length) {
          let sortInfoArray: any[] = [];
          for (let k in sortInfo) {
            if (sortInfo[k]) {
              sortInfoArray[sortInfo[k].seq] = {
                key: k,
                order: sortInfo[k].orderBy,
              };
            }
          }
          sortInfoArray = sortInfoArray.filter(o => typeof o !== 'undefined');

          let i = 0,
            l = sortInfoArray.length,
            aValue: any,
            bValue: any;

          const getValueByKey = function(_item: any, _key: string) {
            return _item[_key] || '';
          };
          filteredList = filteredList.sort(
            (a: any, b: any): any => {
              for (i = 0; i < l; i++) {
                aValue = getValueByKey(a, sortInfoArray[i].key);
                bValue = getValueByKey(b, sortInfoArray[i].key);

                if (typeof aValue !== typeof bValue) {
                  aValue = '' + aValue;
                  bValue = '' + bValue;
                }
                if (aValue < bValue) {
                  return sortInfoArray[i].order === 'asc' ? -1 : 1;
                } else if (aValue > bValue) {
                  return sortInfoArray[i].order === 'asc' ? 1 : -1;
                }
              }
            },
          );
        }
      }

      if (
        nState.styles &&
        nProps.styles &&
        nProps.styles.CTInnerWidth !== nState.styles.CTInnerWidth
      ) {
        if (
          scrollLeft &&
          scrollLeft !== 0 &&
          Number(styles.scrollContentWidth) + scrollLeft <
            Number(styles.scrollContentContainerWidth)
        ) {
          scrollLeft =
            Number(styles.scrollContentContainerWidth) -
            Number(styles.scrollContentWidth);
          if (scrollLeft > 0) {
            scrollLeft = 0;
          }
        }
      }

      if (
        nState.styles &&
        nProps.styles &&
        nProps.styles.CTInnerHeight !== nState.styles.CTInnerHeight
      ) {
        if (
          scrollTop &&
          scrollTop !== 0 &&
          Number(styles.scrollContentHeight) + scrollTop <
            Number(styles.scrollContentContainerHeight)
        ) {
          scrollTop =
            Number(styles.scrollContentContainerHeight) -
            Number(styles.scrollContentHeight);
          if (scrollTop > 0) {
            scrollTop = 0;
          }
        }
      }

      if (nState.styles) {
        console.log(`ch1 : ${nState.styles.scrollContentWidth}`);
      }

      // 데이터 길이에 따라 스타일이 조정되어야 하므로
      // 현재 스타일을 props.styles과 데이터 길이에 따라 계산된 스타일을 머지해 준다.
      styles = {
        ..._styles,
        ...getStylesAboutFilteredList(filteredList, _options, _styles),
      };

      console.log(`ch2 : ${styles.scrollContentWidth}`);

      // loadingData 상태값이 true 이면
      // 컨텐츠 스크롤 위치를 맨 끝으로 보내도록 함.
      if (nProps.loadingData && nProps.loadingData !== nState.loadingData) {
        const focusRow = filteredList.length - 1;
        const {
          bodyTrHeight = 0,
          scrollContentWidth = 0,
          scrollContentHeight = 0,
          scrollContentContainerWidth = 0,
          scrollContentContainerHeight = 0,
        } = styles;

        scrollTop = getScrollPosition(0, -focusRow * bodyTrHeight, {
          scrollWidth: scrollContentWidth,
          scrollHeight: scrollContentHeight,
          clientWidth: scrollContentContainerWidth,
          clientHeight: scrollContentContainerHeight,
        }).scrollTop;
      }

      console.log('apply ~ ', styles.scrollContentWidth);

      return {
        ...nState,
        ...{
          scrollLeft,
          scrollTop,
          mounted: nProps.mounted,
          loading: nProps.loading,
          loadingData: nProps.loadingData,
          setRootState: nProps.setRootState,
          getRootState: nProps.getRootState,
          setScrollLeft: nProps.setScrollLeft,
          setScrollTop: nProps.setScrollTop,
          rootNode: nProps.rootNode,
          clipBoardNode: nProps.clipBoardNode,
          rootObject: nProps.rootObject,
          data: nProps.data,
          filteredList,
          options: nProps.options,
          height: nProps.height,
          onBeforeEvent: nProps.onBeforeEvent,
          onAfterEvent: nProps.onAfterEvent,
          onScrollEnd: nProps.onScrollEnd,
          onRightClick: nProps.onRightClick,
          selection: nProps.selection,
          rowSelector: nProps.rowSelector,

          colGroupMap: nProps.colGroupMap,
          asideColGroup: nProps.asideColGroup,
          colGroup: nProps.colGroup,

          headerTable: nProps.headerTable,
          asideHeaderData: nProps.asideHeaderData,
          leftHeaderData: nProps.leftHeaderData,
          headerData: nProps.headerData,
          leftHeaderColGroup: nProps.leftHeaderColGroup,
          headerColGroup: nProps.headerColGroup,

          bodyRowTable: nProps.bodyRowTable,
          bodyRowMap: nProps.bodyRowMap,
          asideBodyRowData: nProps.asideBodyRowData,
          leftBodyRowData: nProps.leftBodyRowData,
          bodyRowData: nProps.bodyRowData,

          footSumColumns: nProps.footSumColumns,
          footSumTable: nProps.footSumTable,
          leftFootSumData: nProps.leftFootSumData,
          footSumData: nProps.footSumData,

          styles: styles,
          printStartColIndex: nProps.printStartColIndex,
          printEndColIndex: nProps.printEndColIndex,
          visibleHeaderColGroup: nProps.visibleHeaderColGroup,
          visibleBodyRowData: nProps.visibleBodyRowData,
          visibleBodyGroupingData: nProps.visibleBodyGroupingData,
          visibleFootSumData: nProps.visibleFootSumData,
        },
      };
    }
  }

  componentDidMount() {
    this.throttledUpdateDimensions = throttle(
      this.updateDimensions.bind(this),
      100,
    );
    window.addEventListener('resize', this.throttledUpdateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.throttledUpdateDimensions);
  }

  updateDimensions() {
    const {
      scrollLeft = 0,
      scrollTop = 0,
      bodyRowData = { rows: [{ cols: [] }] },
      bodyGroupingData = { rows: [{ cols: [] }] },
      footSumData = { rows: [{ cols: [] }] },
      options = {},
      rootNode,
    } = this.state;
    const { frozenColumnIndex = 0 } = options;

    const calculatedObject = calculateDimensions(
      rootNode && rootNode.current,
      this.state,
    );

    const {
      scrollContentWidth = 0,
      scrollContentHeight = 0,
      scrollContentContainerWidth = 0,
      scrollContentContainerHeight = 0,
    } = calculatedObject.styles;

    let {
      scrollLeft: newScrollLeft = 0,
      scrollTop: newScrollTop = 0,
    } = getScrollPosition(scrollLeft, scrollTop, {
      scrollWidth: scrollContentWidth,
      scrollHeight: scrollContentHeight,
      clientWidth: scrollContentContainerWidth,
      clientHeight: scrollContentContainerHeight,
    });

    const {
      CTInnerWidth: _CTInnerWidth = 0,
      frozenPanelWidth: _frozenPanelWidth = 0,
      asidePanelWidth: _asidePanelWidth = 0,
      rightPanelWidth: _rightPanelWidth = 0,
    } = calculatedObject.styles;

    const { printStartColIndex, printEndColIndex } = getPositionPrintColGroup(
      calculatedObject.headerColGroup,
      Math.abs(newScrollLeft || 0) + _frozenPanelWidth,
      Math.abs(newScrollLeft || 0) +
        _frozenPanelWidth +
        (_CTInnerWidth -
          _asidePanelWidth -
          _frozenPanelWidth -
          _rightPanelWidth),
    );

    const visibleHeaderColGroup = calculatedObject.headerColGroup.slice(
      printStartColIndex,
      printEndColIndex + 1,
    );

    const visibleBodyRowData = getTableByStartEndColumnIndex(
      bodyRowData,
      printStartColIndex + frozenColumnIndex,
      printEndColIndex + frozenColumnIndex,
    );
    const visibleBodyGroupingData = getTableByStartEndColumnIndex(
      bodyGroupingData,
      printStartColIndex + frozenColumnIndex,
      printEndColIndex + frozenColumnIndex,
    );

    const visibleFootSumData = getTableByStartEndColumnIndex(
      footSumData || { rows: [{ cols: [] }] },
      printStartColIndex + frozenColumnIndex,
      printEndColIndex + frozenColumnIndex,
    );

    this.setStoreState({
      styles: calculatedObject.styles,
      printStartColIndex,
      printEndColIndex,
      visibleHeaderColGroup,
      visibleBodyRowData,
      visibleBodyGroupingData,
      visibleFootSumData,
      scrollLeft: newScrollLeft,
      scrollTop: newScrollTop,
    });
  }

  // state 가 업데이트 되기 전.
  setStoreState = (newState: IDataGrid.IStoreState, callback?: () => void) => {
    const {
      filteredList = [],
      scrollLeft = 0,
      scrollTop = 0,
      options = {},
      styles = {},
      headerColGroup = [],
      bodyRowData = { rows: [{ cols: [] }] },
      bodyGroupingData = { rows: [{ cols: [] }] },
      footSumData = { rows: [{ cols: [] }] },
      onScrollEnd,
    } = this.state;
    const { frozenColumnIndex = 0 } = options;
    const { CTInnerWidth } = styles;

    const {
      scrollLeft: _scrollLeft,
      scrollTop: _scrollTop,
      styles: _styles = {},
      filteredList: _filteredList,
    } = newState;

    if (!newState.styles) {
      newState.styles = styles;
    }

    if (
      typeof _scrollLeft !== 'undefined' ||
      typeof _scrollTop !== 'undefined'
    ) {
      const {
        CTInnerWidth: _CTInnerWidth = 0,
        frozenPanelWidth: _frozenPanelWidth = 0,
        asidePanelWidth: _asidePanelWidth = 0,
        rightPanelWidth: _rightPanelWidth = 0,
        scrollContentWidth: scrollWidth = 0,
        scrollContentHeight: scrollHeight = 0,
        scrollContentContainerWidth: clientWidth = 0,
        scrollContentContainerHeight: clientHeight = 0,
      } = { ...styles, ..._styles };

      if (styles.scrollContentWidth !== scrollWidth) {
        newState.styles.scrollContentWidth = scrollWidth;
      }

      let endOfScrollTop: boolean = false;
      let endOfScrollLeft: boolean = false;

      if (typeof _scrollLeft !== 'undefined') {
        if (CTInnerWidth !== _CTInnerWidth || scrollLeft !== _scrollLeft) {
          if (this.state.setScrollLeft) {
            this.state.setScrollLeft(_scrollLeft);
          }

          const {
            printStartColIndex,
            printEndColIndex,
          } = getPositionPrintColGroup(
            headerColGroup,
            Math.abs(_scrollLeft) + _frozenPanelWidth,
            Math.abs(_scrollLeft) +
              _frozenPanelWidth +
              (_CTInnerWidth -
                _asidePanelWidth -
                _frozenPanelWidth -
                _rightPanelWidth),
          );

          newState.printStartColIndex = printStartColIndex;
          newState.printEndColIndex = printEndColIndex;

          newState.visibleHeaderColGroup = headerColGroup.slice(
            printStartColIndex,
            printEndColIndex + 1,
          );
          newState.visibleBodyRowData = getTableByStartEndColumnIndex(
            bodyRowData,
            printStartColIndex + frozenColumnIndex,
            printEndColIndex + frozenColumnIndex,
          );
          newState.visibleBodyGroupingData = getTableByStartEndColumnIndex(
            bodyGroupingData,
            printStartColIndex + frozenColumnIndex,
            printEndColIndex + frozenColumnIndex,
          );
          newState.visibleFootSumData = getTableByStartEndColumnIndex(
            footSumData,
            printStartColIndex + frozenColumnIndex,
            printEndColIndex + frozenColumnIndex,
          );

          newState.styles.CTInnerWidth = _CTInnerWidth;
        }
        if (
          _scrollLeft !== scrollLeft &&
          clientWidth >= scrollWidth + _scrollLeft
        ) {
          endOfScrollLeft = true;
        }
      }

      if (typeof _scrollTop !== 'undefined' && _scrollTop !== scrollTop) {
        if (this.state.setScrollTop) {
          this.state.setScrollTop(_scrollTop);
        }
        if (clientHeight >= scrollHeight + _scrollTop) {
          endOfScrollTop = true;
        }
      }

      if ((endOfScrollTop || endOfScrollLeft) && onScrollEnd) {
        onScrollEnd({
          endOfScrollTop,
          endOfScrollLeft,
        });
      }
    }

    if (_filteredList && filteredList.length !== _filteredList.length) {
      newState.styles = calculateDimensions(
        this.state.rootNode && this.state.rootNode.current,
        newState,
        _filteredList,
      ).styles;
    } else {
      console.log('request ~ ', newState.styles.scrollContentWidth);
    }

    this.setState(
      prevState => {
        return { ...newState };
      },
      () => {
        if (callback) {
          callback();
        }
      },
    );
  };

  dispatch = (
    dispatchType: DataGridEnums.DispatchTypes,
    param: IDataGrid.DispatchParam,
  ) => {
    const {
      data = [],
      listSelectedAll = false,
      scrollLeft = 0,
      colGroup = [],
      rootNode,
      focusedRow = 0,
      sortInfo = {},
      options = {},
      rowSelector,
      selectionSRow,
      selectionSCol,
      selectionERow,
      selectionECol,
      selectionRows,
      selectionCols,
      selection,
    } = this.state;
    const onChangeSelected = rowSelector && rowSelector.onChange;
    const { columnKeys: optionColumnKeys = {} } = options;
    let { filteredList = [] } = this.state;

    const proc = {
      [DataGridEnums.DispatchTypes.FILTER]: () => {
        const { colIndex, filterInfo } = param;
        const checkAll =
          filterInfo[colIndex] === false
            ? true
            : filterInfo[colIndex]._check_all_;

        if (checkAll) {
          filteredList =
            data &&
            data.filter((n: any) => {
              return !n[optionColumnKeys.deleted || '_deleted_'];
            });
        } else {
          filteredList = data.filter((n: any) => {
            if (n) {
              const value = n[colGroup[colIndex].key || ''];

              if (n[optionColumnKeys.deleted || '_deleted_']) {
                return false;
              }

              if (typeof value === 'undefined') {
                if (!filterInfo[colIndex]._UNDEFINED_) {
                  return false;
                }
              } else {
                if (!filterInfo[colIndex][value]) {
                  return false;
                }
              }

              return true;
            }
            return false;
          });
        }

        this.setStoreState({
          filteredList,
          filterInfo,
          scrollTop: 0,
        });

        if (onChangeSelected) {
          onChangeSelected({
            filteredList,
          });
        }
      },
      [DataGridEnums.DispatchTypes.SORT]: () => {
        const { colIndex } = param;
        if (typeof colIndex !== 'undefined') {
          const { key: colKey = '' } = colGroup[colIndex];

          let currentSortInfo: { [key: string]: any } = {};
          let seq: number = 0;
          let sortInfoArray: any[] = [];

          const getValueByKey = function(_item: any, _key: string) {
            return _item[_key] || '';
          };

          for (let k in sortInfo) {
            if (sortInfo[k]) {
              currentSortInfo[k] = sortInfo[k];
              seq++;
            }
          }

          if (currentSortInfo[colKey]) {
            if (currentSortInfo[colKey].orderBy === 'desc') {
              currentSortInfo[colKey].orderBy = 'asc';
            } else if (currentSortInfo[colKey].orderBy === 'asc') {
              delete currentSortInfo[colKey];
            }
          } else {
            currentSortInfo[colKey] = {
              seq: seq++,
              orderBy: 'desc',
            };
          }

          for (let k in currentSortInfo) {
            if (currentSortInfo[k]) {
              sortInfoArray[currentSortInfo[k].seq] = {
                key: k,
                order: currentSortInfo[k].orderBy,
              };
            }
          }
          sortInfoArray = sortInfoArray.filter(o => typeof o !== 'undefined');

          let i = 0,
            l = sortInfoArray.length,
            aValue: any,
            bValue: any;

          const sortedList = filteredList.sort(
            (a: any, b: any): any => {
              for (i = 0; i < l; i++) {
                aValue = getValueByKey(a, sortInfoArray[i].key);
                bValue = getValueByKey(b, sortInfoArray[i].key);

                if (typeof aValue !== typeof bValue) {
                  aValue = '' + aValue;
                  bValue = '' + bValue;
                }
                if (aValue < bValue) {
                  return sortInfoArray[i].order === 'asc' ? -1 : 1;
                } else if (aValue > bValue) {
                  return sortInfoArray[i].order === 'asc' ? 1 : -1;
                }
              }
            },
          );

          this.setStoreState({
            sortInfo: { ...currentSortInfo },
            filteredList: sortedList,
            isInlineEditing: false,
            inlineEditingCell: {},
          });

          if (onChangeSelected) {
            onChangeSelected({
              filteredList: filteredList,
            });
          }
        }
      },
      [DataGridEnums.DispatchTypes.UPDATE]: () => {
        const { row, colIndex, value, eventWhichKey } = param;
        const key = colGroup[colIndex].key;

        let focusRow: number = focusedRow;

        if (key) {
          filteredList[row][key] = value;
          // update filteredList
        }

        if (eventWhichKey) {
          switch (eventWhichKey) {
            case DataGridEnums.KeyCodes.UP_ARROW:
              focusRow = focusedRow < 1 ? 0 : focusedRow - 1;
              break;
            case DataGridEnums.KeyCodes.DOWN_ARROW:
              focusRow =
                focusedRow + 1 >= filteredList.length
                  ? filteredList.length - 1
                  : focusedRow + 1;
              break;
            default:
              break;
          }
        }

        this.setStoreState({
          filteredList: [...filteredList],
          isInlineEditing: false,
          inlineEditingCell: {},
          selectionRows: {
            [focusRow]: true,
          },
          focusedRow: focusRow,
        });

        if (onChangeSelected) {
          onChangeSelected({
            filteredList: filteredList,
          });
        }

        if (rootNode && rootNode.current) {
          rootNode.current.focus();
        }
      },
      [DataGridEnums.DispatchTypes.RESIZE_COL]: () => {
        const { col, newWidth } = param;

        let newState: IDataGridStore = { ...this.state };
        if (newState.colGroup) {
          newState.colGroup[col.colIndex]._width = newState.colGroup[
            col.colIndex
          ].width = newWidth;
        }

        this.updateDimensions();

        this.setStoreState({
          columnResizing: false,
        });

        // const {
        //   styles,
        //   leftHeaderColGroup,
        //   headerColGroup,
        // } = calculateDimensions(rootNode && rootNode.current, newState);

        // this.setStoreState({
        //   scrollLeft,
        //   colGroup: colGroup,
        //   leftHeaderColGroup: leftHeaderColGroup,
        //   headerColGroup: headerColGroup,
        //   styles: styles,
        //   columnResizing: false,
        // });
      },
      [DataGridEnums.DispatchTypes.SELECT]: () => {
        const { rowIndex, checked } = param;

        let rowSelected: boolean = false;
        let selectedAll: boolean = listSelectedAll;

        if (checked === true) {
          rowSelected = true;
        } else if (checked === false) {
          rowSelected = false;
        } else {
          rowSelected = !filteredList[rowIndex]._selected_;
        }

        if (!rowSelected) {
          selectedAll = false;
        }
        filteredList[rowIndex]._selected_ = rowSelected;

        this.setStoreState({
          listSelectedAll: selectedAll,
          selectedRowIndex: rowIndex,
          selectedRowIndexSelected: rowSelected,
          filteredList: [...filteredList],
        });

        if (onChangeSelected) {
          onChangeSelected({
            filteredList: filteredList,
          });
        }
      },
      [DataGridEnums.DispatchTypes.SELECT_ALL]: () => {
        const { checked } = param;
        let selectedAll: boolean = listSelectedAll;
        if (checked === true) {
          selectedAll = true;
        } else if (checked === false) {
          selectedAll = false;
        } else {
          selectedAll = !selectedAll;
        }

        for (let i = 0, l = filteredList.length; i < l; i++) {
          filteredList[i]._selected_ = selectedAll;
        }

        this.setStoreState({
          listSelectedAll: selectedAll,
          filteredList: [...filteredList],
        });

        if (onChangeSelected) {
          onChangeSelected({
            filteredList: filteredList,
          });
        }
      },
      [DataGridEnums.DispatchTypes.CHANGE_SELECTION]: () => {
        const { sRow, sCol, eRow, eCol } = param;

        if (
          selectionSRow !== sRow ||
          selectionSCol !== sCol ||
          selectionERow !== eRow ||
          selectionECol !== eCol
        ) {
          // console.log(sRow, sCol, eRow, eCol);

          if (
            selection &&
            selection.onChange &&
            selectionRows &&
            selectionCols
          ) {
            selection.onChange({
              rows: Object.keys(selectionRows).map(n => Number(n)),
              cols: Object.keys(selectionCols).map(n => Number(n)),
            });
          }

          this.setStoreState({
            selectionSRow: sRow,
            selectionSCol: sCol,
            selectionERow: eRow,
            selectionECol: eCol,
          });
        }
      },
    };

    proc[dispatchType]();
  };

  render() {
    return (
      <Provider
        value={{
          ...this.state,
          ...{
            predefinedFormatter: { ...dataGridFormatter },
            predefinedCollector: { ...dataGridCollector },
            setStoreState: this.setStoreState,
            dispatch: this.dispatch,
          },
        }}
      >
        {this.props.children}
      </Provider>
    );
  }
}

export default { Provider: StoreProvider, Consumer };
