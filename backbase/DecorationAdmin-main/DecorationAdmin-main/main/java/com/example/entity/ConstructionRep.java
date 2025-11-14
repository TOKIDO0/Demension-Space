package com.example.entity;

import com.baomidou.mybatisplus.extension.activerecord.Model;
import lombok.Data;
import org.omg.CORBA.LongLongSeqHelper;

import java.util.List;

@Data
public class ConstructionRep  extends Model<ConstructionRep> {
    //凭证号
    private long certid;
    //凭证名
    private String  certname;
    //施工名称
    private String constructionname;
    //项目号
    private long projectid;
    //施工各项花销
    private Integer money;
    //个凭证总花销
    //private Integer certmoney;
    //总花销
    //private Integer moneyinall;




}
