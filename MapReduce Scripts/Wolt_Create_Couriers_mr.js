/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/task','N/search', 'N/error', 'N/email'],

function(record, runtime, task, search, error, email) {
   
    function getInputData() {
    	
    	var TranSearch =  search.create({
            type: 'customrecord_sta_wolt_vendor_import',
            columns: [{
                name: 'custrecord_sta_w_vendorid'
                //sort: search.Sort.ASC
            }
            ],
            filters: [
            {
                name: 'isinactive',
                operator: 'is',
                values: 'F'
            }
            ,{
                name: 'custrecord_sta_w_isvalid',
                operator: 'is',
                values: 'T'
            }
            ,{
                name: 'custrecord_sta_w_vendor_ok',
                operator: 'is',
                values: 'F'
            }
            ,{
                name: 'custrecord_sta_w_bank_ok',
                operator: 'is',
                values: 'F'
            }
            /*,{
                name: 'internalidnumber',
                operator: 'lessthan',
                values: '2206'
            }*/
            ],
            title: 'Vendor import search'
        });
    	
    	return TranSearch;

    }

    function map(context) {
    	
    	var sub = '';
    	var subiccode = '';

        var iserror = false;
        
    	
    	var searchResult = JSON.parse(context.value);
    	
    	var vendor = searchResult.values.custrecord_sta_w_vendorid;
    	var intid = searchResult.id;
    	
    	var currRec = record.load({
            type : 'customrecord_sta_wolt_vendor_import',
            id   : intid
         });
    	
    	var sub = currRec.getValue({
            fieldId: 'custrecord_sta_w_subsidiary'
    	});
    	
    	log.debug('vendor:'+vendor+', intid:'+intid+', sub:'+sub);
    	
		var errmsg = '';
		
		if (sub != ''){

			//Check if vendor already exists
			//if (venid != ''){
				
				var venintid = validateVendor(sub, vendor);
				
				log.debug('vendor:'+vendor+', venintid:'+venintid);
				
				if (venintid != ''){
					
					//Update or error?
					
					iserror = true;
					errmsg += 'Vendor '+vendor+' already exists.'+'\n';
					
					currRec.setValue({
			   		    fieldId: 'custrecord_sta_w_message',
			   		    value: errmsg,
			   		    ignoreFieldChange: true
			   		});	
					
					currRec.setValue({
			   		    fieldId: 'custrecord_sta_w_isvalid',
			   		    value: false,
			   		    ignoreFieldChange: true
			   		});
				}
				else {//create new vendor
					
					log.debug('creation of new vendor:'+vendor);
					
					var name = currRec.getValue({
			            fieldId: 'custrecord_sta_w_name'
			        });
					var name2 = currRec.getValue({
			            fieldId: 'custrecord_sta_w_legalname'
					});
					var email = currRec.getValue({
			            fieldId: 'custrecord_sta_w_email'
			        });
					var taxid = currRec.getValue({
			            fieldId: 'custrecord_sta_w_taxregnum'
			        });
					
					var curTxt = currRec.getValue({
			              fieldId: 'custrecord_sta_w_currency'
			        });
					
					if (curTxt != ''){
						var cur = parseInt(validateCurrency(curTxt));
						if (isNaN(cur)==true){cur='';}
					}
					
					log.debug('127');

					var addr1 = currRec.getValue({
			            fieldId: 'custrecord_sta_w_addr1'
			        });
			        var addr2 = currRec.getValue({
					    fieldId: 'custrecord_sta_w_addr2'
			        });
					var city = currRec.getValue({
						fieldId: 'custrecord_sta_w_city'
			        });
					var state = currRec.getValue({
						fieldId: 'custrecord_sta_w_state'
			        });
					var country = currRec.getValue({
						//fieldId: 'custrecord_sta_w_country'
						fieldId: 'custrecord_sta_w_countrycode'
			        });
					var zip = currRec.getValue({
						fieldId: 'custrecord_sta_w_zip'
			        });
					
					var newrec = record.create({
			            type: 'vendor',
			            isDynamic: true
			        });
					
					newrec.setValue({
			            fieldId: 'autoname',
			            value: false
			        });
			        
			        newrec.setValue({
			            fieldId: 'entityid',
			            value: vendor
			        });
					
					newrec.setValue({
			            fieldId: 'externalid',
			            value: vendor
			        });
					
					log.debug('169');
					
					newrec.setValue({
			            fieldId: 'subsidiary',
			            value: sub
			        });
					
					log.debug('176');
					
					newrec.setValue({
			            fieldId: 'companyname',
			            value: name
			        });
					
					log.debug('183');
					
					newrec.setValue({
			            fieldId: 'payablesaccount',
			            value: '630'//28730	Payables - Couriers
			        });
					
					log.debug('190');
					
					newrec.setValue({
			            fieldId: 'custentity_2663_payment_method',
			            value: true
			        });
					
					newrec.setValue({
			            fieldId: 'isperson',
			            value: 'F'
			        });
					
					newrec.setValue({
			            fieldId: 'terms',
			            value: '3'
			        });
					
					log.debug('204');
					
					newrec.setValue({
			            fieldId: 'category',
			            value: '1'
			        });
					
					log.debug('211');
					
					if (name2 != ''){
						newrec.setValue({
				            fieldId: 'legalname',
				            value: name2
				        });
					}
					
					if (email != ''){
						newrec.setValue({
				            fieldId: 'email',
				            value: email
				        });
					}
					
					if (taxid != ''){
						newrec.setValue({
				            fieldId: 'vatregnumber',
				            value: taxid
				        });
					}
					
					if (cur != ''){
						newrec.setValue({
				            fieldId: 'currency',
				            value: cur
				        });
					}
					
					
					//HU
					if (sub == '6'){
						var hurc = currRec.getValue({
							fieldId: 'custrecord_sta_w_hurc'
				        });
						
						if (hurc == true){
							newrec.setValue({
					            fieldId: 'custentity1',
					            value: true
					        });
						}
						
						var husmall = currRec.getValue({
							fieldId: 'custrecord_sta_w_husmall'
				        });
						
						if (husmall == true){
							newrec.setValue({
					            fieldId: 'custentity_sta_wlt_sl_entrepr',
					            value: true
					        });
						}
						
						var hutaxid2 = currRec.getValue({
							fieldId: 'custrecord_sta_w_hutaxid2'
				        });
						
						if (hutaxid2 != ''){
							newrec.setValue({
					            fieldId: 'custentity_sta_wolt_2taxid',
					            value: hutaxid2
					        });
						}
					}
										
					//CZ
					if (sub == '9'){
						var czico = currRec.getValue({
							fieldId: 'custrecord_sta_w_czico'
				        });
					}
					
					
					//addres
					if (addr1 != ''){
						
						newrec.selectNewLine({
							sublistId: 'addressbook'
							});
						
						newrec.setCurrentSublistValue({
							 sublistId: 'addressbook',
							 fieldId: 'defaultshipping',
							 value: true
							 });
						
						newrec.setCurrentSublistValue({
							 sublistId: 'addressbook',
							 fieldId: 'defaultbilling',
							 value: true
							 });
						
						newrec.setCurrentSublistValue({
							 sublistId: 'addressbook',
							 fieldId: 'label',
							 value: 'Bill-To'
							 });
						
						var subrec = newrec.getCurrentSublistSubrecord({
							sublistId : 'addressbook',
							fieldId : 'addressbookaddress'
						});
						
						subrec.setValue({
							 fieldId: 'country',
							 value: country
							 });
						
						subrec.setValue({
							fieldId : 'addr1',
							value : addr1	
						});
						
						if (addr2 != ''){ 
							subrec.setValue({
								fieldId : 'addr2',
								value : addr2	
							});
						}
						
						if (zip != ''){ 
							subrec.setValue({
								fieldId : 'zip',
								value : zip	
							});
						}
						
						if (city != ''){ 
							subrec.setValue({
								fieldId : 'city',
								value : city	
							});
						}
						
						if (state != ''){ 
							subrec.setValue({
								fieldId : 'state',
								value : state	
							});
						}
						
						newrec.commitLine({
				            sublistId: 'addressbook'
				        });
						
					}
					
					try {
						var recordId = newrec.save({
				            enableSourcing: true,
				            ignoreMandatoryFields: false
				        });
					} catch (e) {
						log.error({
						title: e.name,
						details: e.message
						});
					}
					
					if (isNaN(recordId) == false && recordId != 0) {
						
						log.debug({
							title: 'Record created successfully',
							details: 'Id: ' + recordId
							});
						
						var id = record.submitFields({
		        	        type: 'customrecord_sta_wolt_vendor_import',
		        	        id: intid,
		        	        values: {
		        	        	custrecord_sta_w_vendor_ok: true,
		        	        },
		        	        options: {
		        	            enableSourcing: false,
		        	            ignoreMandatoryFields : true
		        	        }
		        	    });

					}
					
					
				}//end create new vendor
				
			//}//end (venid != '')
			
		} //end (sub != '')
		
		
		else {//(sub == '')
			
			iserror = true;
			
			errmsg += 'There is no subsidiary with internalid '+sub;
			
			currRec.setValue({
	   		    fieldId: 'custrecord_sta_w_message',
	   		    value: errmsg,
	   		    ignoreFieldChange: true
	   		});
		}//end (sub == '')
		
		
		if (iserror == true){
			
			log.debug('intid:'+intid+', iserror:'+iserror);
			
			currRec.setValue({
	   		    fieldId: 'custrecord_sta_w_isvalid',
	   		    value: false,
	   		    ignoreFieldChange: true
	   		});
			
		}
		
		
		currRec.save();

    }

    function reduce(context) {

    }

    function summarize(summary) {
    	
    	handleErrorIfAny(summary);
    	
    	var scriptTask = task.create({taskType: task.TaskType.MAP_REDUCE});
     	scriptTask.scriptId = 'customscript_sta_wolt_create_bankdet_mr';
     	scriptTask.deploymentId = 'customdeploy_sta_wolt_create_bankdet_mr';
     	scriptTask.submit();

    }
    
//Functions start
    
    function validateSub(sub){
    	var subid = '';
    	var subcurrintid;
    	var subdata = new Array();
    	var subSearchObj = search.create({
    		   type: 'subsidiary',
    		   columns: [
               {
                   name: 'internalid'
               }
               ,{
                   name: 'currency'
               }
               ],
    		   filters:
    		   [
    		      ['internalid','is',sub],
    		      'AND', 
    		      ['isinactive','is',false]
    		   ]
    		});

    	var searchResultCount = subSearchObj.runPaged().count;
    		
    	if (searchResultCount > 0 && sub != ''){
        		var result = subSearchObj.run().getRange(0, 1);
    			subid = result[0].getValue('internalid');
    			subcurrintid = result[0].getValue('currency');
    			
    			subdata.push(subid);
    			subdata.push(subcurrintid);
    	}
    	return subdata;
    }
    
    function validateCurrency(curtxt){
    	var curintid = '';
    	var curSearchObj = search.create({
    		   type: 'currency',
    		   columns: [
               {
                   name: 'internalid'
               }
               ],
    		   filters:
    		   ['name','is',curtxt]
    		});
    		var searchResultCount = curSearchObj.runPaged().count;
    		
        	if (searchResultCount > 0){
        		var result = curSearchObj.run().getRange(0, 1);
        		curintid = result[0].getValue('internalid');
        	}
        	//log.debug('currency intid:'+curintid);
    	return curintid;
    }
    
    function validateVendor(sub, venid){
    	var vendorid = '';
    	var venSearchObj = search.create({
    		   type: 'vendor',
    		   columns: [
               {
                   name: 'internalid'
               }
               ],
    		   filters:
    		   [
    			   ['subsidiary','anyof',sub], 
     		      'AND',
     		      ['externalid','is',venid]
    		   ]
    		});
    		var searchResultCount = venSearchObj.runPaged().count;
    		
        	if (searchResultCount > 0){
        		var result = venSearchObj.run().getRange(0, 1);
        		vendorid = result[0].getValue('internalid');
        	}
    	return vendorid;
    }
    
    function handleErrorIfAny(summary)
    {
    	var inputSummary = summary.inputSummary;
    	var mapSummary = summary.mapSummary;
    	var reduceSummary = summary.reduceSummary;
    	if (inputSummary.error)
    	{
    	var e = error.create({
    	name: 'INPUT_STAGE_FAILED',
    	message: inputSummary.error
    	});
    	handleErrorAndSendNotification(e, 'getInputData');
    	}
    	else {log.debug('summary ok');}
    	handleErrorInStage('map', mapSummary);
    	handleErrorInStage('reduce', reduceSummary);
    }
    
    function handleErrorInStage(stage, summary)
    {
    	var errorMsg = [];
    	summary.errors.iterator().each(function(key, value){
    	var msg = 'Failure from key id: ' + key + '. Error was:' + JSON.parse(value).message + '\n';
    	errorMsg.push(msg);
    	return true;
    	});
    	if (errorMsg.length > 0)
    	{
    	var e = error.create({
    	name: 'RECORD_CREATE_FAILED',
    	message: JSON.stringify(errorMsg)
    	});
    	handleErrorAndSendNotification(e, stage);
    	}
    	else {log.debug(stage+' ok');}
    }
    
    function handleErrorAndSendNotification(e, stage)
    {
    	log.error('Stage: ' + stage + ' failed', e);
    	var author = -5;
    	var recipients = 'pekka.penttinen@staria.com';
    	var subject = 'Map/Reduce script ' + runtime.getCurrentScript().id + ' failed for stage: ' + stage;
    	var body = 'An error occurred with the following information:\n' +
    	'Error code: ' + e.name + '\n' +
    	'Error msg: ' + e.message;
    	email.send({
    	author: author,
    	recipients: recipients,
    	subject: subject,
    	body: body
    	});
    }
    
    //Functions end
    
    

    return {
        getInputData: getInputData,
        map: map,
        //reduce: reduce,
        summarize: summarize
    };
    
});
