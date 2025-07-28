/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 * otherwise make available this code.
 *
 * @author rtolentino
 * @NApiVersion 2.1
 * @NScriptId 8859_PaymentBatchSelection_cs
 * @NScriptType clientscript
 * @NModuleScope Public
 */

define([
        '../../lib/wrapper/9997_NsWrapperMessage',
        '../../lib/wrapper/9997_NsWrapperUrl',
        '../../lib/wrapper/9997_NsWrapperRecord',
        '../../lib/wrapper/9997_NsWrapperDialog',
        '../../lib/wrapper/9997_NsWrapperSearch'
    ],

    function(wrapperMessage, wrapperUrl, wrapperRecord, dialog, search) {
        //Refactoring to SS2.1
        var record;
        var subListId = 'custpage_8859_batch_list_open';
// comments are added in file to repo
        //Payment Batch status update by veerababu
        var BATCH_OPEN = '1';
        var BATCH_UPDATING = '2';
        var BATCH_PENDINGAPPROVAL = '3';

        var REC_REF_NOTE = 'custrecord_2663ß_ref_note';
        var REC_STATUS = 'custrecord_2663_status';
        var REC_AGGREGATE = 'custrecord_2663_aggregate';
        var REC_APPROVAL_ROUTING = 'custrecord_ep_eft_approval_routing';
        var REC_PFA = 'customrecord_2663_file_admin';
        var REC_EP_PREF = 'customrecord_ep_preference';

        function pageInit(context){
            record = context.currentRecord;

            var translationStrings = record.getValue({
                fieldId: 'translation_strings'
            });
            var MESSAGEMAP_BATCHCS = JSON.parse(translationStrings);
            var batchUpdating = record.getValue({
                fieldId: 'custpage_8859_batch_updating'
            });
            var isLicensed = record.getValue({
                fieldId: 'custpage_8859_license'
            });

            if (!isLicensed) {
                wrapperMessage.error('Error',MESSAGEMAP_BATCHCS['licenseerror']);
            }

            if (batchUpdating) {
                wrapperMessage.warn('Warning',MESSAGEMAP_BATCHCS['updatewarning']);
            }
        }

        function closeBatches() {
            var batchesBeingUpdated = [];
            var batchesClosed = 0;
            var batchesSelected = 0;
            var message = '';
            var batchNames = [];
            var batchesSentForApproval = [];
            var lineCount = record.getLineCount({
                sublistId: subListId
            });
            var translationStrings = record.getValue({
                fieldId: 'translation_strings'
            });
            var MESSAGEMAP_BATCHCS = JSON.parse(translationStrings);
            for (var i = 0; i < lineCount; i++) {
                var selectFieldVal = record.getSublistValue({
                    sublistId: subListId,
                    fieldId: 'custpage_select',
                    line: i
                });
                if (selectFieldVal) {
                    var batchId = record.getSublistValue({
                        sublistId: subListId,
                        fieldId: 'custpage_id',
                        line: i
                    });
                    if (batchId) {
                        var currBatch = wrapperRecord.load({
                            type: REC_PFA,
                            id: batchId
                        });
                        if (currBatch) {
                            var currStatus = currBatch.getValue({
                                fieldId: REC_STATUS
                            });
                            var eftNote = record.getSublistValue({
                                sublistId: subListId,
                                fieldId: 'custpage_eft_note',
                                line: i
                            });
                            var aggregateByPayee = record.getSublistValue({
                                sublistId: subListId,
                                fieldId: 'custpage_aggregate_by_payee',
                                line: i
                            });
                            currBatch.setValue({
                                fieldId: REC_REF_NOTE,
                                value: eftNote
                            });
                            currBatch.setValue({
                                fieldId: REC_AGGREGATE,
                                value: aggregateByPayee
                            });
                            if (currStatus !== BATCH_OPEN) {
                                if (currStatus === BATCH_UPDATING) {
                                    var batchBeingUpdated = record.getSublistValue({
                                        sublistId: subListId,
                                        fieldId: 'custpage_batch_name',
                                        line: i
                                    });
                                    batchBeingUpdated.push(batchBeingUpdated);
                                }
                            } else {
                                var refNote = currBatch.getValue({
                                    fieldId: REC_REF_NOTE
                                });
                                if (refNote) {
                                    currBatch.setValue({
                                        fieldId: REC_STATUS,
                                        value: BATCH_PENDINGAPPROVAL
                                    });
                                    currBatch.save();
                                    batchesClosed++;
                                    var batchName = currBatch.getValue({
                                        fieldId: 'altname'
                                    });
                                    batchesSentForApproval.push(batchName);
                                } else {
                                    if (!message) {
                                        message = MESSAGEMAP_BATCHCS['entereftnote'];
                                    }
                                    var altName = currBatch.getValue({
                                        fieldId: 'altname'
                                    });
                                    batchNames.push(altName);
                                }
                                batchesSelected++;
                            }
                        }
                    }
                }
            }

            showMessage(batchesClosed, MESSAGEMAP_BATCHCS, batchesBeingUpdated, lineCount, batchesSelected, batchNames, message, batchesSentForApproval);

            if (batchesClosed) {
                // suppress the alert
                setWindowChanged(window, false);
                // refresh page
                document.location.reload(true);
            }
        }

        function showMessage(batchesClosed, MESSAGEMAP_BATCHCS, batchesBeingUpdated, lineCount, batchesSelected, batchNames, msg, batchesSentForApproval) {
            if (batchesClosed) {
                msg = MESSAGEMAP_BATCHCS['submittedforapproval']  + '\n';
                msg += batchesSentForApproval.join(', ');
            }
            if (batchesBeingUpdated.length > 0) {
                msg = msg ? msg + '\n' : '';
                msg += [MESSAGEMAP_BATCHCS['beingupdatednotclosed'], batchesBeingUpdated.join('\n')].join('\n');
            } else if (!lineCount) {
                msg = MESSAGEMAP_BATCHCS['noopenbatches'];
            } else if (lineCount && !batchesSelected) {
                msg = MESSAGEMAP_BATCHCS['selectopenbatches'];
            } else if (batchesSelected) {
                if(batchesClosed && batchNames.length !== 0){
                    msg += '\n' + MESSAGEMAP_BATCHCS['entereftnote'] + '\n';
                }
                msg += batchNames.join(', ');            }

            if (msg) {
                showAlert(msg);
            }
        }

        function showAlert(mesage){
            dialog.defaultAlert({
                message : mesage
            });
        }

        function refreshBatch() {
            var bankAcct = record.getValue({
                fieldId: 'bank_acct'
            });
            var bankAcctId = JSON.parse(bankAcct).id;
            if (bankAcctId) {
                var url = wrapperUrl.resolveScript({
                    scriptId: 'customscript_8859_batch_updater_su',
                    deploymentId: 'customdeploy_8859_batch_updater_su'
                });
                if (!document.forms['main_form'].onsubmit || document.forms['main_form'].onsubmit()) {
                    document.forms.main_form.action = url;
                    // suppress the alert
                    setWindowChanged(window, false);
                    setSubmitTrigger(record, 'submit');
                    document.forms.main_form.submit();
                }  else {
                    dialog.showAlert('Please select Bank Account.');
                }
            }
        }

        /**
         * [setSubmitTrigger description]
         * @param {[type]} currRec [description]
         * @param {[type]} trigger [description]
         */
        function setSubmitTrigger(currRec, trigger){
            if(currRec && trigger){
                currRec.setValue({
                    fieldId : 'custpage_2663_trigger',
                    value   : trigger
                });
            }
        }

        function fieldChanged(context){
            var currentRecord = context.currentRecord;
            var fieldName = context.fieldId;

            try{
                    if (fieldName === 'bank_acct') {
                        var newURL = document.location.href;
                        setWindowChanged(window, false);
                        var paramIndex = newURL.indexOf('custpage_2663_bank_acct_id') - 1;
                        if (paramIndex > -1) {
                            newURL = newURL.substring(0, paramIndex);
                        }

                        newURL += ['&custpage_2663_bank_acct_id=', getBankAccountId(currentRecord)].join('');
                        document.location.assign(newURL);
                    }

            }
            catch(e){
                var errorText = [e.name, e.message].join(' : ');
                wrapperMessage.error('[ep] 8859_payment_batch_selection_cs#fieldChanged', errorText);
            }
        }

        function getBankAccountInfo(rec){
            return JSON.parse(rec.getValue({ fieldId: 'bank_acct'}));
        }

        function getBankAccountId(recd){
            var bankAccountInfo = getBankAccountInfo(recd);
            return (bankAccountInfo.id || '');
        }

        function markAll(){
            var lineCount = record.getLineCount({
                sublistId: subListId
            });

            for(var i = 0; i < lineCount; i++){
                var batchStatus = record.getSublistValue({
                    sublistId: subListId,
                    fieldId: 'custpage_status',
                    line: i
                });
                if (batchStatus === 'Open') {
                    setSublistVal('custpage_select', true, i);
                }
            }
        }

        function unMarkAll(){
            var lineCount = record.getLineCount({
                sublistId: subListId
            });

            for(var i = 0; i < lineCount; i++){
                setSublistVal('custpage_select', false, i);
            }
        }

        function setSublistVal(field, value, line){
            record.selectLine({
                sublistId: subListId,
                line: line
            });

            record.setCurrentSublistValue({
                sublistId: subListId,
                fieldId: field,
                value: value,
            });
        }

        function isApprovalRoutingEnabled () {
            var preferenceSearch = search.create({
                type: REC_EP_PREF,
                columns: [
                    { name: REC_APPROVAL_ROUTING }
                ]
            });
            var searchResultSet = preferenceSearch.run();
            var searchresults = searchResultSet.getRange({
                start: 0,
                end: 1
            });
            if (searchresults) {
                return searchresults[0].getValue({
                    name: REC_APPROVAL_ROUTING
                });
            }
            return false;
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            markAll: markAll,
            unMarkAll: unMarkAll,
            isApprovalRoutingEnabled: isApprovalRoutingEnabled,
            refreshBatch: refreshBatch,
            closeBatches: closeBatches
        };
    });
