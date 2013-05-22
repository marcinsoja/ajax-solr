(function($) {

    /**
     <h2>Price</h2>
     <div class="tagcloud" id="Price">
        <input type="text" class="range rangeFrom" placeholder="od" name="priceFrom" autocomplete="off" > - 
        <input type="text" class="range rangeTo" placeholder="do" name="priceTo" autocomplete="off" >
     </div>
     */
   AjaxSolr.RangeWidget = AjaxSolr.AbstractWidget.extend({
        selectorFrom: '.rangeFrom'
        ,selectorTo: '.rangeTo'
        ,init: function() {
            
            var self = this;
            
            $(this.target).find('input').bind('keydown', function(e) {
                if (e.which == 13) {
                    self.doRangeRequest();
                }
            });
        }
        ,doRangeRequest: function() {
            
            var currentRangeFrom = $(this.target).find(this.selectorFrom).val()
                ,currentRangeTo = $(this.target).find(this.selectorTo).val()
                ,rangeFrom = this.filterValue(currentRangeFrom, '*')
                ,rangeTo = this.filterValue(currentRangeTo, '*')
                ,fieldValue
            ;

            fieldValue = '[' + rangeFrom + ' TO ' + rangeTo + ']';

            if ('[* TO *]' == fieldValue) {
                this.manager.store.removeByValue('fq', new RegExp('^-?' + this.field + ':'));
                this.doRequest();
            } else if (this.set(fieldValue)) {
                this.doRequest();
            }
        }
        ,filterValue: function(value, defaultEmpty) {
            
            value = $.trim(value);
            
            if ('' == value || '*' == value) {
                return defaultEmpty;
            }
            
            return parseFloat(value.replace(",", "."));
        }
        ,afterRequest: function() {

            var filterQuery = this.getFilterQueryResponse()
                ,index = AjaxSolr.inArray(new RegExp('^-?' + this.field + ':'), filterQuery)
                ,found = (-1 != index)
                ,value
                ,storeIndexes
            ;

            if (found) {

                value = str_replace([this.field + ':', '[', ']'], '', filterQuery[index]);
                value = value.split(' TO ');

                if (2 == value.length) {
                    $(this.target).find(this.selectorFrom).val(this.filterValue(value[0], ''));
                    $(this.target).find(this.selectorTo).val(this.filterValue(value[1], ''));
                }

            } else {

                storeIndexes = this.manager.store.find('fq', new RegExp('^-?' + this.field + ':'));

                if (!storeIndexes) {
                    $(this.target).find(this.selectorFrom).val('');
                    $(this.target).find(this.selectorTo).val('');
                }
            }
        }
        ,getFilterQueryResponse: function() {
            
            var response = this.manager.response
                ,responseHasFilterQuery = this.hasProperty(response, 'responseHeader.params.fq')
                filterQuery = []
            ;

            if (responseHasFilterQuery) {
                if (AjaxSolr.isArray(response.responseHeader.params.fq)) {
                    filterQuery = response.responseHeader.params.fq;
                } else {
                    filterQuery = [response.responseHeader.params.fq];
                }
            }

            return filterQuery;
        }
        ,hasProperty: function(object, path) {
            
            var properties = path.split('.')
                ,currentObject = object
            ;
            
            for(var i = 0; i < properties.length; i++) {
                if(!(properties[i] in currentObject)) {
                    return false;
                }
                currentObject = currentObject[properties[i]];
            }
            
            return true;
        }
        ,set: function(value) {
            
            var remove = this.manager.store.removeByValue('fq', new RegExp('^-?' + this.field + ':')),
            add = this.manager.store.addByValue('fq', this.fq(value));
    
            return remove || add;
        }
        ,fq: function(value, exclude) {
            return (exclude ? '-' : '') + this.field + ':' + AjaxSolr.Parameter.escapeValue(value);
        }
    });

})(jQuery);
