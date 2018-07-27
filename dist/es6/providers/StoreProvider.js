"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const stores_1 = require("../stores");
const utils_1 = require("../utils");
const formatter_1 = require("../functions/formatter");
const store = {
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
    setStoreState: () => { },
    dispatch: () => { },
};
const { Provider, Consumer } = React.createContext(store);
class StoreProvider extends React.Component {
    constructor() {
        super(...arguments);
        this.state = store;
        // state 가 업데이트 되기 전.
        this.setStoreState = (newState) => {
            const { filteredList = [], scrollLeft = 0, scrollTop = 0, options = {}, styles = {}, headerColGroup = [], bodyRowData = { rows: [{ cols: [] }] }, bodyGroupingData = { rows: [{ cols: [] }] }, onScrollEnd, onChangeSelected, sortInfo, } = this.state;
            const { frozenColumnIndex = 0 } = options;
            const { CTInnerWidth } = styles;
            const { scrollLeft: _scrollLeft, scrollTop: _scrollTop, styles: _styles = {}, filteredList: _filteredList, sortInfo: _sortInfo, } = newState;
            if (typeof _scrollLeft !== 'undefined' ||
                typeof _scrollTop !== 'undefined') {
                const { CTInnerWidth: _CTInnerWidth = 0, frozenPanelWidth: _frozenPanelWidth = 0, asidePanelWidth: _asidePanelWidth = 0, rightPanelWidth: _rightPanelWidth = 0, scrollContentWidth: scrollWidth = 0, scrollContentHeight: scrollHeight = 0, scrollContentContainerWidth: clientWidth = 0, scrollContentContainerHeight: clientHeight = 0, } = Object.assign({}, styles, _styles);
                let endOfScrollTop = false;
                let endOfScrollLeft = false;
                if (typeof _scrollLeft !== 'undefined' && _scrollLeft !== scrollLeft) {
                    if (CTInnerWidth !== _CTInnerWidth || scrollLeft !== _scrollLeft) {
                        const { printStartColIndex, printEndColIndex, } = utils_1.getPositionPrintColGroup(headerColGroup, Math.abs(_scrollLeft) + _frozenPanelWidth, Math.abs(_scrollLeft) +
                            _frozenPanelWidth +
                            (_CTInnerWidth -
                                _asidePanelWidth -
                                _frozenPanelWidth -
                                _rightPanelWidth));
                        newState.printStartColIndex = printStartColIndex;
                        newState.printEndColIndex = printEndColIndex;
                        newState.visibleHeaderColGroup = headerColGroup.slice(printStartColIndex, printEndColIndex + 1);
                        newState.visibleBodyRowData = utils_1.getTableByStartEndColumnIndex(bodyRowData, printStartColIndex + frozenColumnIndex, printEndColIndex + frozenColumnIndex);
                        newState.visibleBodyGroupingData = utils_1.getTableByStartEndColumnIndex(bodyGroupingData, printStartColIndex + frozenColumnIndex, printEndColIndex + frozenColumnIndex);
                    }
                    if (clientWidth >= scrollWidth + _scrollLeft) {
                        endOfScrollLeft = true;
                    }
                }
                if (typeof _scrollTop !== 'undefined' && _scrollTop !== scrollTop) {
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
                newState.styles = utils_1.calculateDimensions(utils_1.getNode(this.state.getRootNode), this.state, _filteredList).styles;
            }
            if (_filteredList && _filteredList !== filteredList && onChangeSelected) {
                onChangeSelected({
                    filteredList: _filteredList,
                });
            }
            if (_sortInfo && _sortInfo !== sortInfo && onChangeSelected) {
                onChangeSelected({
                    filteredList: filteredList,
                });
            }
            this.setState(newState);
        };
        this.dispatch = (dispatchType, param) => {
            const { data = [], listSelectedAll = false, scrollLeft = 0, colGroup = [], getRootNode, focusedRow = 0, sortInfo = {}, options = {}, } = this.state;
            const { columnKeys: optionColumnKeys = {} } = options;
            const rootNode = utils_1.getNode(getRootNode);
            let { filteredList = [] } = this.state;
            const proc = {
                [stores_1.DispatchTypes.FILTER]: () => {
                    const { colIndex, filterInfo } = param;
                    const checkAll = filterInfo[colIndex] === false
                        ? true
                        : filterInfo[colIndex].__check_all__;
                    if (checkAll) {
                        filteredList =
                            data &&
                                data.filter((n) => {
                                    return !n[optionColumnKeys.deleted || '__deleted__'];
                                });
                    }
                    else {
                        filteredList = data.filter((n) => {
                            if (n) {
                                const value = n[colGroup[colIndex].key || ''];
                                if (n[optionColumnKeys.deleted || '__deleted__']) {
                                    return false;
                                }
                                if (typeof value === 'undefined') {
                                    if (!filterInfo[colIndex].__UNDEFINED__) {
                                        return false;
                                    }
                                }
                                else {
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
                    });
                },
                [stores_1.DispatchTypes.SORT]: () => {
                    const { colIndex } = param;
                    if (typeof colIndex !== 'undefined') {
                        const { key: colKey = '' } = colGroup[colIndex];
                        let currentSortInfo = {};
                        let seq = 0;
                        let sortInfoArray = [];
                        const getValueByKey = function (_item, _key) {
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
                            }
                            else if (currentSortInfo[colKey].orderBy === 'asc') {
                                delete currentSortInfo[colKey];
                            }
                        }
                        else {
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
                        let i = 0, l = sortInfoArray.length, aValue, bValue;
                        const sortedList = filteredList.sort((a, b) => {
                            for (i = 0; i < l; i++) {
                                aValue = getValueByKey(a, sortInfoArray[i].key);
                                bValue = getValueByKey(b, sortInfoArray[i].key);
                                if (typeof aValue !== typeof bValue) {
                                    aValue = '' + aValue;
                                    bValue = '' + bValue;
                                }
                                if (aValue < bValue) {
                                    return sortInfoArray[i].order === 'asc' ? -1 : 1;
                                }
                                else if (aValue > bValue) {
                                    return sortInfoArray[i].order === 'asc' ? 1 : -1;
                                }
                            }
                        });
                        this.setStoreState({
                            sortInfo: Object.assign({}, currentSortInfo),
                            filteredList: sortedList,
                            isInlineEditing: false,
                            inlineEditingCell: {},
                        });
                    }
                },
                [stores_1.DispatchTypes.UPDATE]: () => {
                    const { row, colIndex, value, eventWhichKey } = param;
                    const key = colGroup[colIndex].key;
                    let focusRow = focusedRow;
                    if (key) {
                        filteredList[row][key] = value;
                        // update filteredList
                    }
                    if (eventWhichKey) {
                        switch (eventWhichKey) {
                            case stores_1.KeyCodes.UP_ARROW:
                                focusRow = focusedRow < 1 ? 0 : focusedRow - 1;
                                break;
                            case stores_1.KeyCodes.DOWN_ARROW:
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
                    if (rootNode) {
                        rootNode.focus();
                    }
                },
                [stores_1.DispatchTypes.RESIZE_COL]: () => {
                    const { col, newWidth } = param;
                    let newState = Object.assign({}, this.state);
                    if (newState.colGroup) {
                        newState.colGroup[col.colIndex]._width = newState.colGroup[col.colIndex].width = newWidth;
                    }
                    const { styles, leftHeaderColGroup, headerColGroup, } = utils_1.calculateDimensions(rootNode, newState);
                    this.setStoreState({
                        scrollLeft,
                        colGroup: colGroup,
                        leftHeaderColGroup: leftHeaderColGroup,
                        headerColGroup: headerColGroup,
                        styles: styles,
                        columnResizing: false,
                    });
                },
                [stores_1.DispatchTypes.SELECT]: () => {
                    const { rowIndex, checked } = param;
                    let rowSelected = false;
                    let selectedAll = listSelectedAll;
                    if (checked === true) {
                        rowSelected = true;
                    }
                    else if (checked === false) {
                        rowSelected = false;
                    }
                    else {
                        rowSelected = !filteredList[rowIndex].__selected__;
                    }
                    if (!rowSelected) {
                        selectedAll = false;
                    }
                    filteredList[rowIndex].__selected__ = rowSelected;
                    this.setStoreState({
                        listSelectedAll: selectedAll,
                        selectedRowIndex: rowIndex,
                        selectedRowIndexSelected: rowSelected,
                        filteredList: [...filteredList],
                    });
                },
                [stores_1.DispatchTypes.SELECT_ALL]: () => {
                    const { checked } = param;
                    let selectedAll = listSelectedAll;
                    if (checked === true) {
                        selectedAll = true;
                    }
                    else if (checked === false) {
                        selectedAll = false;
                    }
                    else {
                        selectedAll = !selectedAll;
                    }
                    for (let i = 0, l = filteredList.length; i < l; i++) {
                        filteredList[i].__selected__ = selectedAll;
                    }
                    this.setStoreState({
                        listSelectedAll: selectedAll,
                        filteredList: [...filteredList],
                    });
                },
            };
            proc[dispatchType]();
        };
    }
    static getDerivedStateFromProps(newProps, prevState) {
        /*
          초기에만 값을 수신하여 랜더링 하고, 그 후엔 setState로 제어 되는 항목.
          newProps.styles === prevState.styles &&
          newProps.printStartColIndex === prevState.printStartColIndex &&
          newProps.printEndColIndex === prevState.printEndColIndex &&
          newProps.visibleHeaderColGroup === prevState.visibleHeaderColGroup &&
          newProps.visibleBodyRowData === prevState.visibleBodyRowData &&
          newProps.visibleBodyGroupingData === prevState.visibleBodyGroupingData
         */
        if (newProps.mounted === prevState.mounted &&
            newProps.loading === prevState.loading &&
            newProps.loadingData === prevState.loadingData &&
            newProps.setRootState === prevState.setRootState &&
            newProps.getRootState === prevState.getRootState &&
            newProps.getRootNode === prevState.getRootNode &&
            newProps.getClipBoardNode === prevState.getClipBoardNode &&
            newProps.rootObject === prevState.rootObject &&
            newProps.data === prevState.data &&
            newProps.options === prevState.options &&
            newProps.height === prevState.height &&
            newProps.onBeforeEvent === prevState.onBeforeEvent &&
            newProps.onAfterEvent === prevState.onAfterEvent &&
            newProps.onScrollEnd === prevState.onScrollEnd &&
            newProps.onChangeSelected === prevState.onChangeSelected &&
            newProps.headerTable === prevState.headerTable &&
            newProps.bodyRowTable === prevState.bodyRowTable &&
            newProps.bodyRowMap === prevState.bodyRowMap &&
            newProps.asideHeaderData === prevState.asideHeaderData &&
            newProps.leftHeaderData === prevState.leftHeaderData &&
            newProps.headerData === prevState.headerData &&
            newProps.asideColGroup === prevState.asideColGroup &&
            newProps.asideBodyRowData === prevState.asideBodyRowData &&
            newProps.leftBodyRowData === prevState.leftBodyRowData &&
            newProps.bodyRowData === prevState.bodyRowData &&
            newProps.colGroup === prevState.colGroup &&
            newProps.colGroupMap === prevState.colGroupMap &&
            newProps.leftHeaderColGroup === prevState.leftHeaderColGroup &&
            newProps.headerColGroup === prevState.headerColGroup) {
            return null;
        }
        else {
            let scrollTop = prevState.scrollTop;
            let filteredList = prevState.filteredList || [];
            let styles = prevState.styles || {};
            const { sortInfo } = prevState;
            const { data, styles: _styles = {}, options: _options = {} } = newProps;
            // 데이터를 정리하는 과정. data > filteredList
            if (data && newProps.data !== prevState.data) {
                // sort 되었다고 판단됨. filteredList를 sort 해주어야 함.
                const { options = {} } = prevState;
                const { columnKeys: optionColumnKeys = {} } = options;
                filteredList = data.filter((n) => {
                    return !n[optionColumnKeys.deleted || '__deleted__'];
                });
                // 정렬 오브젝트가 있다면 정렬 프로세스 적용하여 새로운 데이터 정렬
                if (sortInfo && Object.keys(sortInfo).length) {
                    let sortInfoArray = [];
                    for (let k in sortInfo) {
                        if (sortInfo[k]) {
                            sortInfoArray[sortInfo[k].seq] = {
                                key: k,
                                order: sortInfo[k].orderBy,
                            };
                        }
                    }
                    sortInfoArray = sortInfoArray.filter(o => typeof o !== 'undefined');
                    let i = 0, l = sortInfoArray.length, aValue, bValue;
                    const getValueByKey = function (_item, _key) {
                        return _item[_key] || '';
                    };
                    filteredList = filteredList.sort((a, b) => {
                        for (i = 0; i < l; i++) {
                            aValue = getValueByKey(a, sortInfoArray[i].key);
                            bValue = getValueByKey(b, sortInfoArray[i].key);
                            if (typeof aValue !== typeof bValue) {
                                aValue = '' + aValue;
                                bValue = '' + bValue;
                            }
                            if (aValue < bValue) {
                                return sortInfoArray[i].order === 'asc' ? -1 : 1;
                            }
                            else if (aValue > bValue) {
                                return sortInfoArray[i].order === 'asc' ? 1 : -1;
                            }
                        }
                    });
                }
            }
            // 데이터 길이에 따라 스타일이 조정되어야 하므로
            // 현재 스타일을 props.styles과 데이터 길이에 따라 계산된 스타일을 머지해 준다.
            styles = Object.assign({}, _styles, utils_1.getStylesAboutFilteredList(filteredList, _options, _styles));
            // loadingData 상태값이 true 이면
            // 컨텐츠 스크롤 위치를 맨 끝으로 보내도록 함.
            if (newProps.loadingData &&
                newProps.loadingData !== prevState.loadingData) {
                const focusRow = filteredList.length - 1;
                const { bodyTrHeight = 0, scrollContentWidth = 0, scrollContentHeight = 0, scrollContentContainerWidth = 0, scrollContentContainerHeight = 0, } = styles;
                scrollTop = utils_1.getScrollPosition(0, -focusRow * bodyTrHeight, {
                    scrollWidth: scrollContentWidth,
                    scrollHeight: scrollContentHeight,
                    clientWidth: scrollContentContainerWidth,
                    clientHeight: scrollContentContainerHeight,
                }).scrollTop;
            }
            return Object.assign({}, prevState, {
                scrollTop: scrollTop,
                mounted: newProps.mounted,
                loading: newProps.loading,
                loadingData: newProps.loadingData,
                setRootState: newProps.setRootState,
                getRootState: newProps.getRootState,
                getRootNode: newProps.getRootNode,
                getClipBoardNode: newProps.getClipBoardNode,
                rootObject: newProps.rootObject,
                data: newProps.data,
                filteredList,
                options: newProps.options,
                height: newProps.height,
                onBeforeEvent: newProps.onBeforeEvent,
                onAfterEvent: newProps.onAfterEvent,
                onScrollEnd: newProps.onScrollEnd,
                onChangeSelected: newProps.onChangeSelected,
                headerTable: newProps.headerTable,
                bodyRowTable: newProps.bodyRowTable,
                bodyRowMap: newProps.bodyRowMap,
                asideHeaderData: newProps.asideHeaderData,
                leftHeaderData: newProps.leftHeaderData,
                headerData: newProps.headerData,
                asideColGroup: newProps.asideColGroup,
                asideBodyRowData: newProps.asideBodyRowData,
                leftBodyRowData: newProps.leftBodyRowData,
                bodyRowData: newProps.bodyRowData,
                colGroup: newProps.colGroup,
                colGroupMap: newProps.colGroupMap,
                leftHeaderColGroup: newProps.leftHeaderColGroup,
                headerColGroup: newProps.headerColGroup,
                styles: styles,
                printStartColIndex: newProps.printStartColIndex,
                printEndColIndex: newProps.printEndColIndex,
                visibleHeaderColGroup: newProps.visibleHeaderColGroup,
                visibleBodyRowData: newProps.visibleBodyRowData,
                visibleBodyGroupingData: newProps.visibleBodyGroupingData,
            });
        }
    }
    componentDidMount() {
        this.throttledUpdateDimensions = utils_1.throttle(this.updateDimensions.bind(this), 100);
        window.addEventListener('resize', this.throttledUpdateDimensions);
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.throttledUpdateDimensions);
    }
    updateDimensions() {
        const { scrollLeft = 0, scrollTop = 0 } = this.state;
        const styles = utils_1.calculateDimensions(utils_1.getNode(this.state.getRootNode), this.state).styles;
        const { scrollContentWidth = 0, scrollContentHeight = 0, scrollContentContainerWidth = 0, scrollContentContainerHeight = 0, } = styles;
        let { scrollLeft: newScrollLeft = 0, scrollTop: newScrollTop = 0, } = utils_1.getScrollPosition(scrollLeft, scrollTop, {
            scrollWidth: scrollContentWidth,
            scrollHeight: scrollContentHeight,
            clientWidth: scrollContentContainerWidth,
            clientHeight: scrollContentContainerHeight,
        });
        this.setStoreState({
            styles: styles,
            scrollLeft: newScrollLeft,
            scrollTop: newScrollTop,
        });
    }
    render() {
        return (React.createElement(Provider, { value: Object.assign({}, this.state, {
                predefinedFormatter: Object.assign({}, formatter_1.default),
                setStoreState: this.setStoreState,
                dispatch: this.dispatch,
            }) }, this.props.children));
    }
}
exports.default = { Provider: StoreProvider, Consumer };
//# sourceMappingURL=StoreProvider.js.map