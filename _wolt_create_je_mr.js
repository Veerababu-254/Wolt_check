/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            let bankStatementJeSearchObj;
            try {
                bankStatementJeSearchObj = search.load({ "id": "customsearch_create_je_bank_statement" });
            } catch (e) {
                log.error('error in getinputdata', typeof e);
                var msg = '';
                if (e.hasOwnProperty('message')) {
                    msg = e.name + ': ' + e.message;
                    log.error({
                        title: 'System Error',
                        details: e.name + '' + e.message + '' + JSON.stringify(e.stack)
                    });
                } else {
                    msg = e.toString();
                    log.error({
                        title: 'Unexpected Error',
                        details: e.toString(msg)
                    });
                }
            }
            return bankStatementJeSearchObj;

        }




        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            try {

                let jeLinearray = [];
                let bankStatementTransactionArr = [];
                let bankStatementTransObj = {};
                let bankStatementTranJe = [];

                let bankStatementObj = JSON.parse(reduceContext.values[0]);
               // log.debug("bankStatementObj", bankStatementObj);
                let bankStatementId = bankStatementObj.values["GROUP(custrecord_wolt_je_bank_statement)"].value;
                log.debug("bankStatementId", bankStatementId);

                let customrecord_wolt_bank_state_tr_jeSearchObj = search.create({
                    type: "customrecord_wolt_bank_state_tr_je",
                    filters:
                        [
                            ["custrecord_wolt_je_bank_statement", "anyof", bankStatementId],
                          "AND", 
                            ["custrecord_wolt_bank_state_processed","is","F"]
                        ],
                    columns:
                        [
                            "internalid",
                            "custrecord_wolt_je_bank_statement",
                            "custrecord_wolt_bank_statement_trans",
                            "custrecord_wolt_bank_state_date",
                            "custrecord_wolt_credit_account",
                            "custrecord_wolt_debit_account",
                            "custrecord_wolt_account_type",
                            "custrecord_wolt_credit_amount",
                            "custrecord_wolt_debit_amount",
                            "custrecord_wolt_je_subsidiary",
                            "custrecord_wolt_je_description",
                            "custrecord_wolt_matching_role",
                            "custrecord_wolt_matching_rule_counter_pa"

                        ]
                });
                var bankStatementResults = executeSearch(customrecord_wolt_bank_state_tr_jeSearchObj);
               // log.debug("bankStatementResults", bankStatementResults);

                if (bankStatementResults.length == 0) {
                    return;
                }

                bankStatementResults.forEach(e => {
                    bankStatementTranJe.push(e.getValue("internalid"))
                    let bankStatementId = e.getValue("custrecord_wolt_je_bank_statement");
                    let bankStatementTransId = e.getValue("custrecord_wolt_bank_statement_trans");
                    let bankStatementDate = e.getValue("custrecord_wolt_bank_state_date");
                    let creditAccount = e.getValue("custrecord_wolt_credit_account");
                    let debitAccount = e.getValue("custrecord_wolt_debit_account");
                    let accountType = e.getValue("custrecord_wolt_account_type");
                    let credit_Amount = e.getValue("custrecord_wolt_credit_amount");
                    let debit_Amount = e.getValue("custrecord_wolt_debit_amount");
                    let subsidiary = e.getValue("custrecord_wolt_je_subsidiary");
                    let description = e.getValue("custrecord_wolt_je_description");
                    let mactchedRuleDsc = e.getValue("custrecord_wolt_matching_role");

                    let key = bankStatementId + "_" + creditAccount + "_" + debitAccount + "_" + mactchedRuleDsc;
                    bankStatementTransactionArr.push(bankStatementTransId);

                    if (!(key in bankStatementTransObj)) {
                        bankStatementTransObj[key] = [];
                    }
                    var innerObj = {
                        bankStatementId: bankStatementId,
                        bankStatementTransId: bankStatementTransId,
                        bankStatementDate: bankStatementDate,
                        creditAccount: creditAccount,
                        debitAccount: debitAccount,
                        credit_Amount: credit_Amount,
                        debit_Amount: debit_Amount,
                        subsidiary: subsidiary,
                        description: description
                    }
                    bankStatementTransObj[key].push(innerObj);
                });
               // log.debug("bankStatementTransObj", bankStatementTransObj);
                
                // creating Journal entry 
                var journalEntryRec = record.create({
                    type: record.Type.JOURNAL_ENTRY,
                    isDynamic: true
                });


                var bankStatementRecId = bankStatementResults[0].getValue("custrecord_wolt_je_bank_statement");
                journalEntryRec.setValue("custbody_bank_statement", bankStatementRecId);
                journalEntryRec.setValue("subsidiary", bankStatementResults[0].getValue("custrecord_wolt_je_subsidiary"));

                for (let key in bankStatementTransObj) {
                    if (bankStatementTransObj.hasOwnProperty(key)) {
                        var innerJELineArray = bankStatementTransObj[key];
                        var lineDescription = [];
                        var creditAmount = 0;
                        var debit_Amount = 0;
                        var innerLineobj = {};
                        innerJELineArray.forEach(e => {
                            lineDescription.push(e.description);
                            creditAmount += parseFloat(e.credit_Amount);
                            debit_Amount += parseFloat(e.debit_Amount);
                            innerLineobj["credit_Amount"] = creditAmount;
                            innerLineobj["debit_Amount"] = debit_Amount;
                            innerLineobj["description"] = lineDescription;
                            innerLineobj["creditAccount"] = e.creditAccount;
                            innerLineobj["debitAccount"] = e.debitAccount;

                        });
                        jeLinearray.push(innerLineobj)
                    }
                }
                log.debug("jeLinearray", jeLinearray);

                if (jeLinearray.length == 0) {
                    return;
                }

                jeLinearray.forEach(elem => {
                    var finalDescreption = "";
                    if (elem.description.length > 0) {
                        finalDescreption = elem.description.join("_");
                    }
                    journalEntryRec.selectNewLine({ sublistId: 'line' });
                    journalEntryRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: elem.creditAccount });
                    journalEntryRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: elem.credit_Amount });
                    //journalEntryRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: finalDescreption });
                    journalEntryRec.commitLine({ sublistId: 'line' });

                    journalEntryRec.selectNewLine({ sublistId: 'line' });
                    journalEntryRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: elem.debitAccount });
                    journalEntryRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: elem.debit_Amount });
                    //journalEntryRec.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: finalDescreption });
                    journalEntryRec.commitLine({ sublistId: 'line' });

                });

                let journalEntryRecId = journalEntryRec.save(true, true);
                log.debug("journalEntryRecId", journalEntryRecId);
                

                if (journalEntryRecId) {
                    record.submitFields({
                        type: "customrecord_bank_statement",
                        id: bankStatementRecId,
                        values: { "custrecord157": true }
                    });

                    bankStatementTransactionArr.forEach(bTranid => {
                        record.submitFields({
                            type: "customrecord_ba_transactions",
                            id: bTranid,
                            values: { "custrecord_bst_select": true, "custrecord_bst_payment_no": journalEntryRecId }
                        });
                    });

                    bankStatementTranJe.forEach(bTranid => {
                        record.submitFields({
                            type: "customrecord_wolt_bank_state_tr_je",
                            id: bTranid,
                            values: { "custrecord_wolt_bank_state_processed": true,}
                        });
                    });
                }
            } catch (e) {
                log.error('error in reduce', typeof e);
                var msg = '';
                if (e.hasOwnProperty('message')) {
                    msg = e.name + ': ' + e.message;
                    log.error({
                        title: 'System Error',
                        details: e.name + '' + e.message + '' + JSON.stringify(e.stack)
                    });
                } else {
                    msg = e.toString();
                    log.error({
                        title: 'Unexpected Error',
                        details: e.toString(msg)
                    });
                }
            }


        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

        }
        /*
    * helper function to get the search results
    */
        function executeSearch(srch) {
            var results = [];

            var pagedData = srch.runPaged({
                pageSize: 1000
            });
            pagedData.pageRanges.forEach(function (pageRange) {
                var page = pagedData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    results.push(result);
                });
            });
            return results;
        };

        return { getInputData, reduce, summarize }

    });
